/**
 * QR Code decoding utility
 * Decodes QR codes from uploaded image files using jsqr
 */

import jsQR from 'jsqr';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_DIMENSION = 1500;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'];

interface DecodeResult {
  success: boolean;
  code?: string;
  rawValue?: string;
  error?: string;
}

/**
 * Extract a promo code from a decoded QR value.
 * Handles full URLs like https://copperlinegolf.com/redeem?code=CADDY-PRO-XXX
 * and raw code strings like CADDY-PRO-XXX.
 */
function extractPromoCode(value: string): string | null {
  // Try to parse as URL and extract ?code= param
  try {
    const url = new URL(value);
    const codeParam = url.searchParams.get('code');
    if (codeParam) return codeParam.toUpperCase();
  } catch {
    // Not a URL, continue
  }

  // Check if the raw value looks like a promo code (alphanumeric with dashes)
  const trimmed = value.trim().toUpperCase();
  if (/^[A-Z0-9-]{6,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Load an image file onto an offscreen canvas and return its pixel data.
 * Caps dimensions at MAX_IMAGE_DIMENSION to prevent memory issues.
 */
function loadImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if needed
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        const scale = MAX_IMAGE_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(ctx.getImageData(0, 0, width, height));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Decode a QR code from an uploaded image file.
 * Returns the extracted promo code if found.
 */
export async function decodeQRCodeFromFile(file: File): Promise<DecodeResult> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'Please upload an image file' };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'Image is too large' };
  }

  // Load and decode
  let imageData: ImageData;
  try {
    imageData = await loadImageData(file);
  } catch {
    return { success: false, error: 'Failed to load image' };
  }

  const result = jsQR(imageData.data, imageData.width, imageData.height);
  if (!result) {
    return { success: false, error: 'No QR code found. Try a clearer photo' };
  }

  const rawValue = result.data;
  const code = extractPromoCode(rawValue);

  if (!code) {
    return { success: false, rawValue, error: 'Does not contain a valid promo code' };
  }

  return { success: true, code, rawValue };
}
