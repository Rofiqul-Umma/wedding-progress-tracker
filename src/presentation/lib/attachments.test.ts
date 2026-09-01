import { describe, it, expect } from 'vitest';
import {
  serializeAttachment,
  parseAttachment,
  isImageAttachment,
  MAX_ATTACHMENT_BYTES,
} from './attachments';
import type { Attachment } from '@domain/entities/types';

const img: Attachment = {
  name: 'ring.jpg',
  type: 'image/jpeg',
  data: 'data:image/jpeg;base64,AAAA',
};
const pdf: Attachment = {
  name: 'quote.pdf',
  type: 'application/pdf',
  data: 'data:application/pdf;base64,BBBB',
};

describe('serializeAttachment / parseAttachment', () => {
  it('round-trips an attachment', () => {
    expect(parseAttachment(serializeAttachment(img))).toEqual(img);
    expect(parseAttachment(serializeAttachment(pdf))).toEqual(pdf);
  });

  it('serializes null/undefined to an empty string', () => {
    expect(serializeAttachment(null)).toBe('');
    expect(serializeAttachment(undefined)).toBe('');
  });

  it('parses empty, null, and garbage input to null', () => {
    expect(parseAttachment('')).toBeNull();
    expect(parseAttachment(null)).toBeNull();
    expect(parseAttachment(undefined)).toBeNull();
    expect(parseAttachment('not json')).toBeNull();
    expect(parseAttachment('{}')).toBeNull();
    expect(parseAttachment('{"name":"x"}')).toBeNull();
  });

  it('fills missing name/type when data is present', () => {
    const parsed = parseAttachment('{"data":"data:text/plain;base64,CC"}');
    expect(parsed).toEqual({
      name: 'file',
      type: 'application/octet-stream',
      data: 'data:text/plain;base64,CC',
    });
  });
});

describe('isImageAttachment', () => {
  it('is true only for image types', () => {
    expect(isImageAttachment(img)).toBe(true);
    expect(isImageAttachment(pdf)).toBe(false);
    expect(isImageAttachment(null)).toBe(false);
  });
});

describe('MAX_ATTACHMENT_BYTES', () => {
  it('is roughly 1.5 MB', () => {
    expect(MAX_ATTACHMENT_BYTES).toBe(Math.round(1.5 * 1024 * 1024));
  });
});
