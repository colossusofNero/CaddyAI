/**
 * PWA Install Prompt Component
 * Shows a prompt to install the app when available
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  initPWAInstall,
  showPWAInstallPrompt,
  isPWAInstalled,
  isPWAInstallAvailable,
} from '@/lib/pwa';
import { Button } from '@/components/ui/Button';

export interface PWAInstallPromptProps {
  /** Delay before showing prompt (ms) */
  delay?: number;
  /** Position of the prompt */
  position?: 'top' | 'bottom';
  /** Auto-hide after user dismisses */
  autoHide?: boolean;
}

export function PWAInstallPrompt({
  delay = 3000,
  position = 'bottom',
  autoHide = true,
}: PWAInstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isPWAInstalled()) {
      return;
    }

    // Initialize PWA install listener
    initPWAInstall();

    // Listen for install available event
    const handleInstallAvailable = () => {
      setIsInstallable(true);
      setTimeout(() => {
        setShowPrompt(true);
      }, delay);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setIsInstallable(false);
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-installed', handleAppInstalled);

    // Check if already installable
    if (isPWAInstallAvailable()) {
      handleInstallAvailable();
    }

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, [delay]);

  const handleInstall = async () => {
    const accepted = await showPWAInstallPrompt();
    if (accepted || autoHide) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to not show again for 7 days
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Check if user previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDays) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!isInstallable) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: position === 'bottom' ? 100 : -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed ${
            position === 'bottom' ? 'bottom-4' : 'top-20'
          } left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50`}
        >
          <div className="bg-white border-2 border-primary/20 rounded-2xl shadow-2xl p-4 sm:p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-text-primary mb-1">
                  Install CaddyAI
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  Add to your home screen for quick access and a better experience on the course.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="md"
                    onClick={handleInstall}
                    className="flex-1 touch-manipulation"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Install App
                  </Button>
                  <Button
                    size="md"
                    variant="ghost"
                    onClick={handleDismiss}
                    className="touch-manipulation"
                  >
                    Not Now
                  </Button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-2 -mt-2 -mr-2 text-text-muted hover:text-text-primary transition-colors rounded-lg touch-manipulation"
                aria-label="Dismiss"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Minimal PWA Install Banner
 * Compact banner for less intrusive install prompt
 */
export function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isPWAInstalled()) return;

    initPWAInstall();

    const handleInstallAvailable = () => {
      const dismissed = localStorage.getItem('pwa-banner-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowBanner(true), 5000);
      }
    };

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    return () =>
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
  }, []);

  const handleInstall = async () => {
    await showPWAInstallPrompt();
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-16 left-0 right-0 z-40"
        >
          <div className="bg-primary text-white px-4 py-3 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Download className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium truncate">
                  Install CaddyAI for the best experience
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleInstall}
                  className="px-4 h-9 bg-white text-primary rounded-lg font-medium text-sm hover:bg-white/90 transition-colors touch-manipulation"
                >
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
                  aria-label="Dismiss"
                  style={{ minWidth: '36px', minHeight: '36px' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
