/**
 * Sync API
 * Offline support and data synchronization
 */

import type { SyncQueueItem, SyncStatus } from './types';

// Use IndexedDB for offline storage
const DB_NAME = 'Copperline Golf_sync';
const DB_VERSION = 1;
const QUEUE_STORE = 'syncQueue';
const CACHE_STORE = 'dataCache';

/**
 * Initialize IndexedDB
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create sync queue store
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('collection', 'collection', { unique: false });
      }

      // Create data cache store
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        const cacheStore = db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
        cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Sync Manager Class
 */
export class SyncManager {
  private db: IDBDatabase | null = null;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the sync manager
   */
  async initialize(): Promise<void> {
    try {
      this.db = await openDatabase();
      console.log('[SyncManager] Initialized');

      // Start periodic sync (every 30 seconds when online)
      this.startPeriodicSync();
    } catch (error) {
      console.error('[SyncManager] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Add an operation to the sync queue
   */
  async queueOperation(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'attempts'>): Promise<void> {
    try {
      if (!this.db) await this.initialize();

      const queueItem: SyncQueueItem = {
        ...item,
        id: `${item.collection}_${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        attempts: 0,
      };

      await this.addToQueue(queueItem);
      console.log('[SyncManager] Operation queued:', queueItem.type, queueItem.collection);

      // Try to sync immediately if online
      if (navigator.onLine) {
        this.sync().catch(console.error);
      }
    } catch (error) {
      console.error('[SyncManager] Error queuing operation:', error);
      throw error;
    }
  }

  /**
   * Sync all queued operations
   */
  async sync(): Promise<SyncStatus> {
    if (this.isSyncing) {
      console.log('[SyncManager] Sync already in progress');
      return this.getStatus();
    }

    if (!navigator.onLine) {
      console.log('[SyncManager] Offline - skipping sync');
      return this.getStatus();
    }

    this.isSyncing = true;
    console.log('[SyncManager] Starting sync...');

    try {
      const queue = await this.getQueue();

      if (queue.length === 0) {
        console.log('[SyncManager] No operations to sync');
        return this.getStatus();
      }

      console.log(`[SyncManager] Syncing ${queue.length} operations`);

      for (const item of queue) {
        try {
          await this.processQueueItem(item);
          await this.removeFromQueue(item.id);
          console.log('[SyncManager] Synced:', item.type, item.collection, item.id);
        } catch (error: unknown) {
          console.error('[SyncManager] Error syncing item:', item.id, error);

          // Update attempts count
          item.attempts++;
          item.lastError = error instanceof Error ? error.message : String(error);

          // Remove if too many attempts
          if (item.attempts >= 5) {
            console.error('[SyncManager] Max attempts reached, removing:', item.id);
            await this.removeFromQueue(item.id);
          } else {
            await this.updateQueueItem(item);
          }
        }
      }

      console.log('[SyncManager] Sync complete');
      return this.getStatus();
    } catch (error) {
      console.error('[SyncManager] Sync error:', error);
      return this.getStatus();
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get current sync status
   */
  async getStatus(): Promise<SyncStatus> {
    try {
      const queue = await this.getQueue();

      return {
        lastSync: Date.now(),
        pendingChanges: queue.length,
        isSyncing: this.isSyncing,
      };
    } catch (error) {
      console.error('[SyncManager] Error getting status:', error);
      return {
        lastSync: 0,
        pendingChanges: 0,
        isSyncing: false,
        error: 'Failed to get sync status',
      };
    }
  }

  /**
   * Clear all queued operations
   */
  async clearQueue(): Promise<void> {
    try {
      if (!this.db) await this.initialize();

      const transaction = this.db!.transaction([QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('[SyncManager] Queue cleared');
    } catch (error) {
      console.error('[SyncManager] Error clearing queue:', error);
      throw error;
    }
  }

  /**
   * Cache data for offline access
   */
  async cacheData(key: string, data: unknown): Promise<void> {
    try {
      if (!this.db) await this.initialize();

      const transaction = this.db!.transaction([CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE);

      const cacheItem = {
        key,
        data,
        timestamp: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(cacheItem);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('[SyncManager] Data cached:', key);
    } catch (error) {
      console.error('[SyncManager] Error caching data:', error);
    }
  }

  /**
   * Get cached data
   */
  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      if (!this.db) await this.initialize();

      const transaction = this.db!.transaction([CACHE_STORE], 'readonly');
      const store = transaction.objectStore(CACHE_STORE);

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('[SyncManager] Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    // Sync every 30 seconds
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.sync().catch(console.error);
      }
    }, 30000);

    // Also sync when coming back online
    window.addEventListener('online', () => {
      console.log('[SyncManager] Back online - syncing');
      this.sync().catch(console.error);
    });

    window.addEventListener('offline', () => {
      console.log('[SyncManager] Gone offline');
    });
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  private async addToQueue(item: SyncQueueItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async removeFromQueue(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async updateQueueItem(item: SyncQueueItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    // Import API modules dynamically to avoid circular dependencies
    const { clubsApi } = await import('./clubs');
    const { roundsApi } = await import('./rounds');

    switch (item.collection) {
      case 'clubs':
        await this.processClubOperation(item, clubsApi);
        break;
      case 'rounds':
        await this.processRoundOperation(item, roundsApi);
        break;
      case 'shots':
        await this.processShotOperation(item, roundsApi);
        break;
      default:
        console.warn('[SyncManager] Unknown collection:', item.collection);
    }
  }

  private async processClubOperation(item: SyncQueueItem, clubsApi: typeof import('./clubs').clubsApi): Promise<void> {
    switch (item.type) {
      case 'create':
        await clubsApi.createClub(item.data as unknown as Parameters<typeof clubsApi.createClub>[0]);
        break;
      case 'update':
        await clubsApi.updateClub(item.data as unknown as Parameters<typeof clubsApi.updateClub>[0]);
        break;
      case 'delete':
        await clubsApi.deleteClub((item.data as unknown as { id: string }).id);
        break;
    }
  }

  private async processRoundOperation(item: SyncQueueItem, roundsApi: typeof import('./rounds').roundsApi): Promise<void> {
    switch (item.type) {
      case 'create':
        await roundsApi.createRound(item.data as unknown as Parameters<typeof roundsApi.createRound>[0]);
        break;
      case 'update':
        await roundsApi.updateRound(item.data as unknown as Parameters<typeof roundsApi.updateRound>[0]);
        break;
      case 'delete':
        await roundsApi.deleteRound((item.data as unknown as { id: string }).id);
        break;
    }
  }

  private async processShotOperation(item: SyncQueueItem, roundsApi: typeof import('./rounds').roundsApi): Promise<void> {
    switch (item.type) {
      case 'create':
        await roundsApi.addShot(item.data as unknown as Parameters<typeof roundsApi.addShot>[0]);
        break;
      // Shots are typically not updated or deleted individually
    }
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// Initialize on import (client-side only)
if (typeof window !== 'undefined') {
  syncManager.initialize().catch(console.error);
}
