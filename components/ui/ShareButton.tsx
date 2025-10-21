/**
 * Share Button Component
 * Native share button with fallback to copy link
 */

'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { share, isShareSupported, copyToClipboard, vibrate, VIBRATION_PATTERNS } from '@/lib/pwa';
import { Button } from '@/components/ui/Button';

export interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onShareSuccess?: () => void;
  onShareError?: (error: Error) => void;
  className?: string;
}

export function ShareButton({
  title = 'CaddyAI - Your Intelligent Golf Companion',
  text = 'Check out CaddyAI - AI-powered golf caddy for smarter shot decisions!',
  url,
  variant = 'outline',
  size = 'md',
  showLabel = true,
  onShareSuccess,
  onShareError,
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url: shareUrl,
    };

    // Try native share first
    if (isShareSupported()) {
      try {
        const success = await share(shareData);
        if (success) {
          vibrate(VIBRATION_PATTERNS.success);
          onShareSuccess?.();
        }
      } catch (error) {
        console.error('Share error:', error);
        onShareError?.(error as Error);
        // Fallback to copy
        await handleCopyLink();
      }
    } else {
      // Fallback to copy
      await handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      vibrate(VIBRATION_PATTERNS.tap);
      setTimeout(() => setCopied(false), 2000);
      onShareSuccess?.();
    } else {
      onShareError?.(new Error('Failed to copy link'));
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={className}
      icon={
        copied ? (
          <Check className="w-4 h-4" />
        ) : isShareSupported() ? (
          <Share2 className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )
      }
    >
      {showLabel &&
        (copied
          ? 'Link Copied!'
          : isShareSupported()
          ? 'Share'
          : 'Copy Link')}
    </Button>
  );
}

/**
 * Share Icon Button (icon only, no label)
 */
export function ShareIconButton({
  title,
  text,
  url,
  onShareSuccess,
  onShareError,
  className,
}: Omit<ShareButtonProps, 'showLabel' | 'size' | 'variant'>) {
  return (
    <ShareButton
      title={title}
      text={text}
      url={url}
      variant="ghost"
      size="sm"
      showLabel={false}
      onShareSuccess={onShareSuccess}
      onShareError={onShareError}
      className={className}
    />
  );
}
