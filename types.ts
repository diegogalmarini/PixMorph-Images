export enum ImageFormat {
  PNG = 'image/png',
  JPEG = 'image/jpeg',
  WEBP = 'image/webp',
  GIF = 'image/gif',
}

export interface ImageState {
  file: File | null;
  originalUrl: string | null;
  processedUrl: string | null;
  originalDimensions: { width: number; height: number };
  processedDimensions: { width: number; height: number };
  name: string;
}

export interface ResizeOptions {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  quality: number;
  format: ImageFormat;
}

export interface AIOptions {
  prompt: string;
}