import type { Attachment } from '@domain/entities/types';

/** Maximum accepted size for a single attached file (~1.5 MB). */
export const MAX_ATTACHMENT_BYTES = Math.round(1.5 * 1024 * 1024);

/** Longest edge (px) an attached/reference image is downscaled to. */
const MAX_IMAGE_EDGE = 1280;
const JPEG_QUALITY = 0.82;

/** Thrown when a picked file exceeds {@link MAX_ATTACHMENT_BYTES}. */
export class FileTooLargeError extends Error {
  constructor() {
    super('file-too-large');
    this.name = 'FileTooLargeError';
  }
}

/** Read a file as a base64 data URL. */
function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('read-failed'));
    reader.readAsDataURL(file);
  });
}

/** Load a data URL into an HTMLImageElement. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image-decode-failed'));
    img.src = src;
  });
}

/**
 * Read an image file, downscale it so its longest edge is ≤ {@link MAX_IMAGE_EDGE},
 * and return a JPEG data URL. Falls back to the raw data URL if canvas encoding
 * isn't available (e.g. non-browser environments).
 */
export async function readImageCompressed(file: File): Promise<string> {
  const raw = await readAsDataUrl(file);
  try {
    const img = await loadImage(raw);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return raw;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } catch {
    return raw;
  }
}

/**
 * Turn a picked file into an {@link Attachment}. Images are compressed; other
 * files are stored as-is. Throws {@link FileTooLargeError} when the raw file is
 * larger than {@link MAX_ATTACHMENT_BYTES}.
 */
export async function readFileAttachment(file: File): Promise<Attachment> {
  if (file.size > MAX_ATTACHMENT_BYTES) throw new FileTooLargeError();
  const isImage = file.type.startsWith('image/');
  const data = isImage ? await readImageCompressed(file) : await readAsDataUrl(file);
  return {
    name: file.name,
    type: isImage ? 'image/jpeg' : file.type || 'application/octet-stream',
    data,
  };
}

/** Serialize an Attachment for the string-only form value model. */
export function serializeAttachment(a: Attachment | null | undefined): string {
  return a ? JSON.stringify(a) : '';
}

/** Parse a serialized Attachment; returns null for empty/invalid input. */
export function parseAttachment(s: string | null | undefined): Attachment | null {
  if (!s) return null;
  try {
    const o = JSON.parse(s) as Partial<Attachment>;
    if (o && typeof o.data === 'string' && o.data) {
      return {
        name: typeof o.name === 'string' ? o.name : 'file',
        type: typeof o.type === 'string' ? o.type : 'application/octet-stream',
        data: o.data,
      };
    }
  } catch {
    /* fall through */
  }
  return null;
}

/** Whether an Attachment is a viewable image. */
export function isImageAttachment(a: Attachment | null | undefined): boolean {
  return !!a && a.type.startsWith('image/');
}
