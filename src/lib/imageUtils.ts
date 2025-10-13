/**
 * Image Utilities
 * 
 * Handles image compression, format conversion, and optimization
 * for better performance and storage efficiency.
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export interface CompressedImageResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Check if WebP is supported by the browser
 */
export function isWebPSupported(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Compress and convert image to WebP format
 */
export async function compressImage(
  file: File | Blob,
  options: ImageCompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.8,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = async () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to WebP if supported, otherwise use JPEG
        const webpSupported = await isWebPSupported();
        const outputFormat = webpSupported && format === 'webp' ? 'image/webp' : 'image/jpeg';
        const outputQuality = webpSupported && format === 'webp' ? quality : Math.min(quality * 0.9, 0.9);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create data URL
            const dataUrl = canvas.toDataURL(outputFormat, outputQuality);
            const originalSize = file.size;
            const compressedSize = blob.size;
            const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

            resolve({
              blob,
              dataUrl,
              originalSize,
              compressedSize,
              compressionRatio
            });
          },
          outputFormat,
          outputQuality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Download and compress image from URL
 */
export async function downloadAndCompressImage(
  url: string,
  options: ImageCompressionOptions = {}
): Promise<CompressedImageResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return await compressImage(blob, options);
  } catch (error) {
    throw new Error(`Failed to download and compress image: ${error}`);
  }
}

/**
 * Create a low-quality placeholder for images
 */
export function createImagePlaceholder(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Create a card-like gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f8fafc');
  gradient.addColorStop(0.5, '#e2e8f0');
  gradient.addColorStop(1, '#cbd5e1');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add a subtle border
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
  
  // Add a subtle pattern
  ctx.fillStyle = '#cbd5e1';
  for (let i = 0; i < width; i += 30) {
    for (let j = 0; j < height; j += 30) {
      if ((i + j) % 60 === 0) {
        ctx.fillRect(i, j, 15, 15);
      }
    }
  }
  
  // Add "Loading..." text in the center
  ctx.fillStyle = '#64748b';
  ctx.font = `${Math.min(width, height) * 0.08}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Loading...', width / 2, height / 2);
  
  return canvas.toDataURL('image/jpeg', 0.8);
}

/**
 * Preload image with progress callback
 */
export function preloadImage(
  src: string,
  onProgress?: (progress: number) => void
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      onProgress?.(100);
      resolve(img);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    // Simulate progress for better UX
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 90) {
        clearInterval(progressInterval);
        progress = 90;
      }
      onProgress?.(progress);
    }, 100);
    
    img.src = src;
  });
}
