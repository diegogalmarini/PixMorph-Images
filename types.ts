export enum ImageFormat {
  PNG = 'image/png',
  JPEG = 'image/jpeg',
  WEBP = 'image/webp',
  GIF = 'image/gif',
  SVG = 'image/svg+xml',
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

export interface Layer {
  id: string;
  type: 'image' | 'text';
  src: string; // Object URL or Data URL
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  width?: number; // Original width
  height?: number; // Original height
  zIndex: number;
  visible: boolean;
  name: string;
}