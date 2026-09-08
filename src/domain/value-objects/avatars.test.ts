import { describe, it, expect } from 'vitest';
import {
  AVATAR_FACE_IDS,
  AVATAR_FACE_LIST,
  parseAvatar,
  serializeAvatar,
} from './avatars';

describe('AVATAR_FACE_LIST', () => {
  it('uses well-formed, unique ids', () => {
    for (const id of AVATAR_FACE_LIST) expect(id).toMatch(/^[a-z][a-z0-9_]*$/);
    expect(AVATAR_FACE_IDS.size).toBe(AVATAR_FACE_LIST.length);
  });
});

describe('parseAvatar', () => {
  it('reads a portrait id', () => {
    expect(parseAvatar('bride_hijab')).toEqual({ face: 'bride_hijab' });
    // Whitespace from a hand-edited backup should not defeat the lookup.
    expect(parseAvatar('  groom_koko  ')).toEqual({ face: 'groom_koko' });
  });

  it('keeps reading values written before the portraits existed', () => {
    // These two are what a real plan has stored today: the old code-drawn set
    // wrote `"face:color"`, and a later revision `"face:color:skin"`. Both must
    // still resolve to a portrait rather than dropping to a bare initial.
    expect(parseAvatar('short:warn')).toEqual({ face: 'groom_suit' });
    expect(parseAvatar('veil:bad')).toEqual({ face: 'bride_veil' });
    expect(parseAvatar('short:warn:warm')).toEqual({ face: 'groom_suit' });
    expect(parseAvatar('bun:lime:deep')).toEqual({ face: 'bride_sanggul' });
  });

  it('maps every retired id to a portrait', () => {
    // Including the two dropped a redesign earlier for being the wrong culture.
    const retired = [
      'short', 'bun', 'long', 'sanggul', 'pashmina', 'veil',
      'hijab', 'beard', 'glasses', 'bald', 'ponytail', 'cap',
      'curly', 'braids',
    ];
    for (const id of retired) {
      const got = parseAvatar(id);
      expect(got, `${id} should map to a portrait`).not.toBeNull();
      expect(AVATAR_FACE_IDS.has(got!.face)).toBe(true);
    }
  });

  it('returns null when nothing is chosen', () => {
    expect(parseAvatar('')).toBeNull();
    expect(parseAvatar('   ')).toBeNull();
    expect(parseAvatar(undefined)).toBeNull();
  });

  it('returns null for an id we have no portrait for', () => {
    expect(parseAvatar('not_a_face')).toBeNull();
    expect(parseAvatar(':lime')).toBeNull();
    expect(parseAvatar('nope:lime:warm')).toBeNull();
  });
});

describe('serializeAvatar', () => {
  it('round-trips every portrait', () => {
    for (const face of AVATAR_FACE_LIST) {
      expect(parseAvatar(serializeAvatar({ face }))).toEqual({ face });
    }
  });

  it('writes a bare id, with no trailing segments', () => {
    expect(serializeAvatar({ face: 'bride_veil' })).toBe('bride_veil');
  });
});
