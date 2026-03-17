/**
 * QR Code Drop Zone
 * Drag-and-drop on desktop, tap-to-open photo picker on mobile.
 */

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface QRCodeDropZoneProps {
  onFileSelected: (file: File) => void;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
}

export function QRCodeDropZone({ onFileSelected, loading, error, disabled }: QRCodeDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (!disabled && !loading) {
        onFileSelected(file);
      }
    },
    [disabled, loading, onFileSelected]
  );

  const handleClick = () => {
    if (!disabled && !loading) {
      inputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !loading) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={disabled || loading}
        className={`
          w-full min-h-[120px] p-6 rounded-lg border-2 border-dashed
          flex flex-col items-center justify-center gap-2
          transition-colors cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${dragOver
            ? 'border-primary bg-primary/10'
            : error
              ? 'border-red-300 bg-red-50/50'
              : 'border-gray-300 bg-gray-50 hover:border-primary/50 hover:bg-primary/5'
          }
        `}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            <span className="text-sm text-gray-500">Decoding QR code...</span>
          </>
        ) : (
          <>
            {/* Camera/upload icon */}
            <svg
              className={`w-8 h-8 ${error ? 'text-red-400' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              Upload QR Code Image
            </span>
            <span className="text-xs text-gray-500">
              {isTouchDevice
                ? 'Tap to select from photos'
                : 'Drag & drop or click to select'}
            </span>
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
