'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Apple, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

interface DownloadButtonProps {
  platform: 'ios' | 'android';
  variant?: 'primary' | 'secondary';
  showQR?: boolean;
  className?: string;
}

const APP_LINKS = {
  ios: 'https://apps.apple.com/app/Copperline Golf/id123456789', // TODO: Replace with actual App Store ID
  android: 'https://play.google.com/store/apps/details?id=com.Copperline Golf.app',
};

export function DownloadButton({
  platform,
  variant = 'primary',
  showQR = false,
  className = '',
}: DownloadButtonProps) {
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  const link = APP_LINKS[platform];

  useEffect(() => {
    if (showQR) {
      QRCode.toDataURL(link, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).then(setQrCodeDataUrl);
    }
  }, [link, showQR]);

  const isIOS = platform === 'ios';

  return (
    <div className="relative inline-block">
      <motion.a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold
          transition-all duration-200 shadow-lg hover:shadow-xl
          ${
            variant === 'primary'
              ? 'bg-neutral-900 text-white hover:bg-neutral-800'
              : 'bg-white text-neutral-900 border-2 border-neutral-200 hover:border-neutral-300'
          }
          ${className}
        `}
      >
        {isIOS ? (
          <Apple className="w-6 h-6" />
        ) : (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
          </svg>
        )}
        <div className="flex flex-col items-start">
          <span className="text-xs opacity-80">
            {isIOS ? 'Download on the' : 'GET IT ON'}
          </span>
          <span className="text-base font-bold leading-tight">
            {isIOS ? 'App Store' : 'Google Play'}
          </span>
        </div>
      </motion.a>

      {showQR && (
        <button
          onClick={() => setShowQRCode(!showQRCode)}
          className="absolute -top-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary-600 transition-colors"
          aria-label="Show QR Code"
        >
          <QrCode className="w-4 h-4" />
        </button>
      )}

      {showQRCode && qrCodeDataUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-2xl shadow-2xl border border-neutral-200 z-50"
        >
          <div className="text-center mb-3">
            <p className="text-sm font-semibold text-neutral-900">Scan to Download</p>
            <p className="text-xs text-neutral-600">
              {isIOS ? 'iOS App' : 'Android App'}
            </p>
          </div>
          <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
          <button
            onClick={() => setShowQRCode(false)}
            className="mt-3 w-full text-sm text-neutral-600 hover:text-neutral-900"
          >
            Close
          </button>
        </motion.div>
      )}
    </div>
  );
}

export function detectPlatform(): 'ios' | 'android' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}
