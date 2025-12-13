import { ImageFormat, ResizeOptions } from '../types';

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getImageDimensions = (url: string): Promise<{ width: number; height: number; img: HTMLImageElement }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight, img });
    img.onerror = reject;
    img.src = url;
  });
};

export const processImageLocally = async (
  imageUrl: string,
  options: ResizeOptions
): Promise<string> => {
  const { width, height, format, quality } = options;
  const { img } = await getImageDimensions(imageUrl);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // Better quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill background white for JPEG if transparency exists in original
  if (format === ImageFormat.JPEG) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL(format, quality);
};

export const downloadImage = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Calculates the approximate size in bytes of a Base64 Data URL.
 */
export const getDataUrlSize = (dataUrl: string): number => {
  const base64String = dataUrl.split(',')[1] || dataUrl;
  const padding = (base64String.match(/=/g) || []).length;
  return (base64String.length * 0.75) - padding;
};

/**
 * Formats bytes into human readable string (KB, MB).
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};