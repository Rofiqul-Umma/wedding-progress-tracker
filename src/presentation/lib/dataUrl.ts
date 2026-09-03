import type { Attachment } from '@domain/entities/types';
import { downloadBlob } from './download';

/**
 * Decode a base64 `data:` URL into a Blob. Returns null when the input is not a
 * base64 data URL (or is truncated), so callers can degrade instead of throwing.
 */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  const comma = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || comma < 0) return null;
  const header = dataUrl.slice(5, comma);
  if (!header.includes(';base64')) return null;
  const mime = header.split(';')[0] || 'application/octet-stream';
  try {
    const binary = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

/**
 * Save an attachment to disk.
 *
 * Attachments are stored inline as `data:` URLs, and browsers block top-level
 * navigation to those — an `<a href="data:…" target="_blank">` opens a blank
 * tab instead of showing the file. Decoding to a Blob first keeps the download
 * working everywhere.
 */
export function downloadAttachment(attachment: Attachment): void {
  const blob = dataUrlToBlob(attachment.data);
  if (!blob) return;
  downloadBlob(blob, attachment.name || 'attachment', attachment.type);
}
