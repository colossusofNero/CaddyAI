/**
 * Base API Client
 * Centralized Firebase operations with error handling and retry logic
 */

import { db, auth } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  WhereFilterOp,
  DocumentSnapshot,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import type { ApiError, ApiResponse, QueryOptions } from './types';

/**
 * Base API Client class with common Firestore operations
 */
export class ApiClient {
  /**
   * Get current user ID with auth check
   */
  protected getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) {
      throw this.createError('auth/not-authenticated', 'User not authenticated');
    }
    return user.uid;
  }

  /**
   * Create standardized API error
   */
  protected createError(code: string, message: string, details?: any): ApiError {
    return { code, message, details };
  }

  /**
   * Create successful API response
   */
  protected createResponse<T>(data: T): ApiResponse<T> {
    return { data, error: null, loading: false };
  }

  /**
   * Create error API response
   */
  protected createErrorResponse<T>(error: ApiError): ApiResponse<T> {
    return { data: null, error, loading: false };
  }

  /**
   * Create loading API response
   */
  protected createLoadingResponse<T>(): ApiResponse<T> {
    return { data: null, error: null, loading: true };
  }

  /**
   * Get a single document by ID
   */
  protected async getDocument<T>(collectionName: string, documentId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.deserializeDoc<T>(docSnap);
    } catch (error) {
      console.error(`[API] Error getting document ${collectionName}/${documentId}:`, error);
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Get multiple documents with query constraints
   */
  protected async getDocuments<T>(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    try {
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => this.deserializeDoc<T>(doc));
    } catch (error) {
      console.error(`[API] Error getting documents from ${collectionName}:`, error);
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Create a new document
   */
  protected async createDocument<T extends { id: string }>(
    collectionName: string,
    data: T,
    documentId?: string
  ): Promise<T> {
    try {
      const id = documentId || doc(collection(db, collectionName)).id;
      const docRef = doc(db, collectionName, id);
      const serializedData = this.serializeDoc({ ...data, id });

      await setDoc(docRef, serializedData);

      return { ...data, id } as T;
    } catch (error) {
      console.error(`[API] Error creating document in ${collectionName}:`, error);
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Update an existing document
   */
  protected async updateDocument<T>(
    collectionName: string,
    documentId: string,
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, documentId);
      const serializedData = this.serializeDoc(data);

      await updateDoc(docRef, serializedData);
    } catch (error) {
      console.error(`[API] Error updating document ${collectionName}/${documentId}:`, error);
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Delete a document
   */
  protected async deleteDocument(collectionName: string, documentId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`[API] Error deleting document ${collectionName}/${documentId}:`, error);
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Build query constraints from options
   */
  protected buildQueryConstraints(
    options: QueryOptions = {},
    additionalConstraints: QueryConstraint[] = []
  ): QueryConstraint[] {
    const constraints: QueryConstraint[] = [...additionalConstraints];

    if (options.orderBy) {
      constraints.push(orderBy(options.orderBy, options.order || 'asc'));
    }

    if (options.limit) {
      constraints.push(limit(options.limit));
    }

    return constraints;
  }

  /**
   * Build WHERE constraint
   */
  protected where(field: string, operator: WhereFilterOp, value: any): QueryConstraint {
    return where(field, operator, value);
  }

  /**
   * Serialize document data for Firestore
   * Converts Date objects to timestamps
   */
  protected serializeDoc(data: any): any {
    const serialized: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        serialized[key] = Timestamp.fromDate(value);
      } else if (typeof value === 'number' && (key.includes('At') || key.includes('Time'))) {
        // Convert timestamp numbers to Firestore Timestamps
        serialized[key] = Timestamp.fromMillis(value);
      } else if (value !== undefined) {
        serialized[key] = value;
      }
    }

    return serialized;
  }

  /**
   * Deserialize Firestore document to plain object
   * Converts Timestamps to milliseconds
   */
  protected deserializeDoc<T>(docSnap: DocumentSnapshot): T {
    const data = docSnap.data();
    if (!data) {
      throw new Error('Document data is undefined');
    }

    const deserialized: any = { id: docSnap.id };

    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Timestamp) {
        deserialized[key] = value.toMillis();
      } else {
        deserialized[key] = value;
      }
    }

    return deserialized as T;
  }

  /**
   * Handle Firebase errors and convert to ApiError
   */
  protected handleFirebaseError(error: any): ApiError {
    console.error('[API] Firebase error:', error);

    if (error.code) {
      return this.createError(error.code, this.getErrorMessage(error.code), error);
    }

    return this.createError(
      'unknown',
      error.message || 'An unexpected error occurred',
      error
    );
  }

  /**
   * Get user-friendly error message
   */
  protected getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'auth/not-authenticated': 'You must be signed in to perform this action',
      'permission-denied': 'You do not have permission to access this data',
      'not-found': 'The requested data was not found',
      'already-exists': 'This item already exists',
      'failed-precondition': 'Operation failed due to invalid state',
      'resource-exhausted': 'Too many requests. Please try again later',
      'unauthenticated': 'Authentication required',
      'unavailable': 'Service temporarily unavailable. Please try again',
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  }

  /**
   * Retry operation with exponential backoff
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Don't retry on auth errors or client errors
        if (
          error.code?.includes('auth/') ||
          error.code === 'permission-denied' ||
          error.code === 'not-found'
        ) {
          throw error;
        }

        // Wait before retrying with exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Batch operations helper
   */
  protected async batchOperation<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    batchSize = 10
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(operation));
      results.push(...batchResults);
    }

    return results;
  }
}

/**
 * Optimistic update helper
 */
export function createOptimisticUpdate<T>(
  currentData: T,
  updates: Partial<T>
): T {
  return { ...currentData, ...updates };
}

/**
 * Debounce helper for search operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
