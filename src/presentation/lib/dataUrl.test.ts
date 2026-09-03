import { describe, it, expect } from 'vitest';
import { dataUrlToBlob } from './dataUrl';

describe('dataUrlToBlob', () => {
  it('decodes a base64 data URL into a typed blob', () => {
    // "hi" as base64 — two decoded bytes.
    const blob = dataUrlToBlob('data:text/plain;base64,aGk=');
    expect(blob).not.toBeNull();
    expect(blob?.type).toBe('text/plain');
    expect(blob?.size).toBe(2);
  });

  it('keeps the mime type when extra parameters are present', () => {
    const blob = dataUrlToBlob('data:image/jpeg;charset=utf-8;base64,aGk=');
    expect(blob?.type).toBe('image/jpeg');
  });

  it('returns null for inputs it cannot decode', () => {
    expect(dataUrlToBlob('')).toBeNull();
    expect(dataUrlToBlob('https://example.com/a.jpg')).toBeNull();
    // Not base64-encoded, so the payload cannot be turned into bytes.
    expect(dataUrlToBlob('data:text/plain,hello')).toBeNull();
    expect(dataUrlToBlob('data:text/plain;base64,!!!')).toBeNull();
  });
});
