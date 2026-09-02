import type { PlanState } from '@domain/entities/types';
import { migrate } from './migrate';
import { STORE_KEY } from './storeKey';

const BACKUP_PREFIX = `${STORE_KEY}.backup.`;
const BACKUP_INDEX_KEY = `${STORE_KEY}.backups`;
const ACCOUNT_PROVENANCE_KEY = `${STORE_KEY}.account`;

interface StorageLike {
  readonly length: number;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
}

export interface PlanBackupMeta {
  key: string;
  version: 1;
  createdAt: number;
  uid: string;
  reason: 'cloud-existing';
}

interface PlanBackupPayload extends Omit<PlanBackupMeta, 'key'> {
  state: PlanState;
}

export type BackupResult =
  | { ok: true; backup: PlanBackupMeta }
  | { ok: false; reason: 'storage' | 'verification' };

export interface AccountProvenance {
  version: 1;
  uid: string;
  fingerprint: string;
}

/** Verified, recoverable local snapshots taken before cloud data is adopted. */
export class PlanBackupRepository {
  constructor(
    private readonly storage: StorageLike = localStorage,
    private readonly now: () => number = Date.now,
  ) {}

  saveBeforeCloud(uid: string, state: PlanState): BackupResult {
    let createdAt = this.now();
    let key = this.keyFor(uid, createdAt);
    while (this.storage.getItem(key) !== null) {
      createdAt += 1;
      key = this.keyFor(uid, createdAt);
    }

    const payload: PlanBackupPayload = {
      version: 1,
      createdAt,
      uid,
      reason: 'cloud-existing',
      state,
    };
    const encoded = JSON.stringify(payload);

    try {
      this.storage.setItem(key, encoded);
      const stored = this.storage.getItem(key);
      if (!stored || !this.isVerifiedPayload(stored, payload)) {
        this.storage.removeItem(key);
        return { ok: false, reason: 'verification' };
      }

      const backup: PlanBackupMeta = {
        key,
        version: 1,
        createdAt,
        uid,
        reason: 'cloud-existing',
      };
      const index = this.readIndex().filter((entry) => entry.key !== key);
      this.storage.setItem(BACKUP_INDEX_KEY, JSON.stringify([backup, ...index]));

      const verifiedIndex = this.readIndex();
      if (!verifiedIndex.some((entry) => entry.key === key)) {
        this.storage.removeItem(key);
        return { ok: false, reason: 'verification' };
      }
      return { ok: true, backup };
    } catch {
      try {
        this.storage.removeItem(key);
      } catch {
        // Storage is unavailable; the caller still receives a hard failure.
      }
      return { ok: false, reason: 'storage' };
    }
  }

  list(): PlanBackupMeta[] {
    const found = new Map<string, PlanBackupMeta>();
    for (const entry of this.readIndex()) found.set(entry.key, entry);

    // Recover discoverability even if the index was removed or became corrupt.
    try {
      for (let i = 0; i < this.storage.length; i += 1) {
        const key = this.storage.key(i);
        if (!key?.startsWith(BACKUP_PREFIX)) continue;
        const payload = this.parsePayload(this.storage.getItem(key));
        if (!payload) continue;
        found.set(key, {
          key,
          version: 1,
          createdAt: payload.createdAt,
          uid: payload.uid,
          reason: payload.reason,
        });
      }
    } catch {
      // Return any valid entries recovered from the index.
    }

    return [...found.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  load(key: string): PlanState | null {
    if (!key.startsWith(BACKUP_PREFIX)) return null;
    try {
      const payload = this.parsePayload(this.storage.getItem(key));
      return payload ? migrate(payload.state) : null;
    } catch {
      return null;
    }
  }

  getProvenance(): AccountProvenance | null {
    try {
      const parsed = JSON.parse(this.storage.getItem(ACCOUNT_PROVENANCE_KEY) ?? 'null') as unknown;
      if (!parsed || typeof parsed !== 'object') return null;
      const value = parsed as Partial<AccountProvenance>;
      return value.version === 1 &&
        typeof value.uid === 'string' &&
        typeof value.fingerprint === 'string'
        ? { version: 1, uid: value.uid, fingerprint: value.fingerprint }
        : null;
    } catch {
      return null;
    }
  }

  setProvenance(uid: string, state: PlanState): boolean {
    try {
      const value: AccountProvenance = {
        version: 1,
        uid,
        fingerprint: planFingerprint(state),
      };
      this.storage.setItem(ACCOUNT_PROVENANCE_KEY, JSON.stringify(value));
      const stored = this.getProvenance();
      return stored?.uid === uid && stored.fingerprint === value.fingerprint;
    } catch {
      return false;
    }
  }

  matchesProvenance(uid: string, state: PlanState): boolean {
    const value = this.getProvenance();
    return value?.uid === uid && value.fingerprint === planFingerprint(state);
  }

  clearProvenance(): void {
    try {
      this.storage.removeItem(ACCOUNT_PROVENANCE_KEY);
    } catch {
      // Local data remains untouched when storage is unavailable.
    }
  }

  private keyFor(uid: string, createdAt: number): string {
    return `${BACKUP_PREFIX}${uid}.${createdAt}`;
  }

  private readIndex(): PlanBackupMeta[] {
    try {
      const parsed = JSON.parse(this.storage.getItem(BACKUP_INDEX_KEY) ?? '[]') as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isBackupMeta);
    } catch {
      return [];
    }
  }

  private parsePayload(raw: string | null): PlanBackupPayload | null {
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const value = parsed as Partial<PlanBackupPayload>;
    if (
      value.version !== 1 ||
      typeof value.createdAt !== 'number' ||
      typeof value.uid !== 'string' ||
      value.reason !== 'cloud-existing' ||
      !value.state ||
      typeof value.state !== 'object'
    ) {
      return null;
    }
    return value as PlanBackupPayload;
  }

  private isVerifiedPayload(raw: string, expected: PlanBackupPayload): boolean {
    try {
      const actual = this.parsePayload(raw);
      return Boolean(
        actual &&
          actual.version === expected.version &&
          actual.createdAt === expected.createdAt &&
          actual.uid === expected.uid &&
          actual.reason === expected.reason &&
          JSON.stringify(actual.state) === JSON.stringify(expected.state),
      );
    } catch {
      return false;
    }
  }
}

function planFingerprint(state: PlanState): string {
  const source = JSON.stringify(state);
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${source.length}:${(hash >>> 0).toString(36)}`;
}

function isBackupMeta(value: unknown): value is PlanBackupMeta {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<PlanBackupMeta>;
  return (
    typeof entry.key === 'string' &&
    entry.key.startsWith(BACKUP_PREFIX) &&
    entry.version === 1 &&
    typeof entry.createdAt === 'number' &&
    typeof entry.uid === 'string' &&
    entry.reason === 'cloud-existing'
  );
}
