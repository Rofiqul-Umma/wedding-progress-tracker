import { describe, it, expect } from 'vitest';
import {
  AVATAR_COLORS,
  AVATAR_FACES,
  AVATAR_FACE_IDS,
  parseAvatar,
  serializeAvatar,
} from './avatars';

describe('AVATAR_FACES', () => {
  it('uses well-formed, unique ids', () => {
    for (const face of AVATAR_FACES) {
      expect(face.id).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(face.skin).toMatch(/^#[0-9a-f]{6}$/);
      expect(face.hair).toMatch(/^#[0-9a-f]{6}$/);
    }
    expect(AVATAR_FACE_IDS.size).toBe(AVATAR_FACES.length);
  });
});

describe('parseAvatar', () => {
  it('reads a valid face and colour', () => {
    expect(parseAvatar('bun:info')).toEqual({ face: 'bun', color: 'info' });
    // Whitespace from a hand-edited backup should not defeat the lookup.
    expect(parseAvatar('  bun : info  ')).toEqual({ face: 'bun', color: 'info' });
  });

  it('returns null when nothing is chosen', () => {
    expect(parseAvatar('')).toBeNull();
    expect(parseAvatar('   ')).toBeNull();
    expect(parseAvatar(undefined)).toBeNull();
  });

  it('returns null for a face we cannot draw', () => {
    expect(parseAvatar('not_a_face:lime')).toBeNull();
    expect(parseAvatar('lime')).toBeNull();
    expect(parseAvatar(':lime')).toBeNull();
  });

  it('recovers from a bad colour rather than dropping the face', () => {
    expect(parseAvatar('bun:chartreuse')).toEqual({ face: 'bun', color: 'lime' });
    expect(parseAvatar('bun')).toEqual({ face: 'bun', color: 'lime' });
    expect(parseAvatar('bun:')).toEqual({ face: 'bun', color: 'lime' });
  });
});

describe('serializeAvatar', () => {
  it('round-trips every face and colour pair', () => {
    for (const face of AVATAR_FACES) {
      for (const color of AVATAR_COLORS) {
        const raw = serializeAvatar({ face: face.id, color });
        expect(parseAvatar(raw)).toEqual({ face: face.id, color });
      }
    }
  });
});
