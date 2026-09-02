import { describe, expect, it } from 'vitest';
import { selectSyncOwner, shouldResumeAccount } from './syncOwner';

describe('selectSyncOwner', () => {
  it('gives a connecting room ownership before hydration', () => {
    expect(selectSyncOwner('connecting', 'connected')).toBe('room');
  });

  it('gives a connected room ownership over the account', () => {
    expect(selectSyncOwner('connected', 'connected')).toBe('room');
  });

  it('returns account ownership only outside a room', () => {
    expect(selectSyncOwner('idle', 'connected')).toBe('account');
    expect(selectSyncOwner('error', 'connected')).toBe('account');
  });

  it('falls back to local persistence while signed out or paused', () => {
    expect(selectSyncOwner('idle', 'signedOut')).toBe('local');
    expect(selectSyncOwner('idle', 'paused')).toBe('local');
  });

  it('resumes account sync only after room ownership fully ends', () => {
    expect(shouldResumeAccount('room', 'room')).toBe(false);
    expect(shouldResumeAccount('room', 'local')).toBe(true);
    expect(shouldResumeAccount('room', 'account')).toBe(false);
    expect(shouldResumeAccount('local', 'account')).toBe(false);
  });
});
