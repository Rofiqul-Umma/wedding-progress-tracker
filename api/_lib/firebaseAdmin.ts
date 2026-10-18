import type { BudgetItem, Lang, Task } from '../../src/domain/entities/types';

export interface ServiceAccountCredentials {
  project_id: string;
  client_email: string;
  private_key: string;
}

export interface StoredPushToken {
  /** Full Firestore document path: `users/{uid}/pushTokens/{id}` or `rooms/{roomId}/pushTokens/{uid}`. */
  docPath: string;
  /** Parent plan path: `users/{uid}` or `rooms/{roomId}`. */
  spacePath: string;
  /** Document ID (`tokenId` or `clientId`). */
  docId: string;
  token: string;
  lang: Lang;
  currency: string;
  tzOffsetMin: number;
}

export interface FcmOutgoingMessage {
  token: string;
  title: string;
  body: string;
  link: string;
  data?: Record<string, string>;
}

interface EnvSource {
  FIREBASE_SERVICE_ACCOUNT_JSON?: string;
  CRON_SECRET?: string;
}

export function getServerEnv(): EnvSource {
  const g = globalThis as unknown as { process?: { env?: EnvSource } };
  return g.process?.env ?? {};
}

export function parseServiceAccount(raw?: string): ServiceAccountCredentials | null {
  const input = (raw ?? getServerEnv().FIREBASE_SERVICE_ACCOUNT_JSON ?? '').trim();
  if (!input) return null;
  try {
    const jsonStr = input.startsWith('{') ? input : atob(input);
    const parsed = JSON.parse(jsonStr) as Partial<ServiceAccountCredentials>;
    if (
      typeof parsed.project_id === 'string' &&
      typeof parsed.client_email === 'string' &&
      typeof parsed.private_key === 'string'
    ) {
      return {
        project_id: parsed.project_id,
        client_email: parsed.client_email,
        private_key: parsed.private_key.replace(/\\n/g, '\n'),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlEncodeJson(obj: unknown): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(JSON.stringify(obj)));
}

function base64UrlDecodeBytes(str: string): Uint8Array {
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const b64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

let cachedAccessToken: { token: string; expiresAt: number; clientEmail: string } | null = null;

/** Mint an OAuth2 access token for Firestore & FCM HTTP v1 using Web Crypto RS256. */
export async function getAccessToken(
  creds: ServiceAccountCredentials,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  if (
    cachedAccessToken &&
    cachedAccessToken.clientEmail === creds.client_email &&
    cachedAccessToken.expiresAt - 60 > nowSec
  ) {
    return cachedAccessToken.token;
  }

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: creds.client_email,
    sub: creds.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    scope:
      'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging',
    iat: nowSec,
    exp: nowSec + 3600,
  };

  const signingInput = `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(payload)}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(creds.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );

  const assertion = `${signingInput}.${base64UrlEncodeBytes(new Uint8Array(signature))}`;
  const res = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OAuth2 token exchange failed (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in?: number };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: nowSec + (data.expires_in ?? 3600),
    clientEmail: creds.client_email,
  };
  return data.access_token;
}

interface JwkKey extends JsonWebKey {
  kid?: string;
}

let cachedJwks: { keys: JwkKey[]; expiresAt: number } | null = null;

/** Verify a Firebase Auth ID token (anonymous or Google) using Google's SecureToken JWKs. */
export async function verifyFirebaseIdToken(
  idToken: string,
  projectId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(base64UrlDecodeBytes(parts[0]))) as {
      alg?: string;
      kid?: string;
    };
    const claims = JSON.parse(new TextDecoder().decode(base64UrlDecodeBytes(parts[1]))) as {
      iss?: string;
      aud?: string;
      sub?: string;
      exp?: number;
    };

    const nowSec = Math.floor(Date.now() / 1000);
    if (
      header.alg !== 'RS256' ||
      !header.kid ||
      claims.aud !== projectId ||
      claims.iss !== `https://securetoken.google.com/${projectId}` ||
      typeof claims.sub !== 'string' ||
      !claims.sub ||
      typeof claims.exp !== 'number' ||
      claims.exp <= nowSec
    ) {
      return null;
    }

    if (!cachedJwks || cachedJwks.expiresAt <= nowSec) {
      const res = await fetchImpl(
        'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
      );
      if (!res.ok) return null;
      const body = (await res.json()) as { keys?: JwkKey[] };
      cachedJwks = { keys: body.keys ?? [], expiresAt: nowSec + 3600 };
    }

    const jwk = cachedJwks.keys.find((k) => k.kid === header.kid);
    if (!jwk) return null;

    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const signedBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const sigBytes = base64UrlDecodeBytes(parts[2]);
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      sigBytes.buffer.slice(sigBytes.byteOffset, sigBytes.byteOffset + sigBytes.byteLength) as ArrayBuffer,
      signedBytes,
    );
    return valid ? claims.sub : null;
  } catch {
    return null;
  }
}

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  mapValue?: { fields?: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
}

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

function unwrapFirestoreValue(val: FirestoreValue | undefined): unknown {
  if (!val) return undefined;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) return (val.arrayValue?.values ?? []).map(unwrapFirestoreValue);
  if ('mapValue' in val) return unwrapFirestoreFields(val.mapValue?.fields);
  return undefined;
}

function unwrapFirestoreFields(fields: Record<string, FirestoreValue> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!fields) return out;
  for (const [k, v] of Object.entries(fields)) {
    out[k] = unwrapFirestoreValue(v);
  }
  return out;
}

function parsePushTokenDoc(docObj: FirestoreDocument): StoredPushToken | null {
  // docObj.name ends with `/documents/users/{uid}/pushTokens/{id}` or `/documents/rooms/{roomId}/pushTokens/{id}`
  const marker = '/documents/';
  const idx = docObj.name.indexOf(marker);
  if (idx === -1) return null;
  const docPath = docObj.name.slice(idx + marker.length);
  const segments = docPath.split('/');
  if (segments.length !== 4 || segments[2] !== 'pushTokens') return null;

  const data = unwrapFirestoreFields(docObj.fields);
  if (typeof data.token !== 'string' || !data.token) return null;

  return {
    docPath,
    spacePath: `${segments[0]}/${segments[1]}`,
    docId: segments[3],
    token: data.token,
    lang: data.lang === 'id' ? 'id' : 'en',
    currency: typeof data.currency === 'string' && data.currency ? data.currency : 'USD',
    tzOffsetMin: typeof data.tzOffsetMin === 'number' ? data.tzOffsetMin : 0,
  };
}

/** Query all `pushTokens` documents across both `users/*` and `rooms/*`. */
export async function listAllPushTokens(
  creds: ServiceAccountCredentials,
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<StoredPushToken[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${creds.project_id}/databases/(default)/documents:runQuery`;
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'pushTokens', allDescendants: true }],
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Firestore runQuery pushTokens failed (${res.status})`);
  }

  const rows = (await res.json()) as Array<{ document?: FirestoreDocument }>;
  const out: StoredPushToken[] = [];
  for (const row of rows) {
    if (!row.document) continue;
    const parsed = parsePushTokenDoc(row.document);
    if (parsed) out.push(parsed);
  }
  return out;
}

/** List push tokens registered in a specific shared room (`rooms/{roomId}/pushTokens`). */
export async function listRoomPushTokens(
  creds: ServiceAccountCredentials,
  accessToken: string,
  roomId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<StoredPushToken[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${creds.project_id}/databases/(default)/documents/rooms/${encodeURIComponent(roomId)}/pushTokens`;
  const res = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { documents?: FirestoreDocument[] };
  const out: StoredPushToken[] = [];
  for (const docObj of data.documents ?? []) {
    const parsed = parsePushTokenDoc(docObj);
    if (parsed) out.push(parsed);
  }
  return out;
}

async function listCollectionDocs(
  creds: ServiceAccountCredentials,
  accessToken: string,
  collectionPath: string,
  fetchImpl: typeof fetch,
): Promise<Record<string, unknown>[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${creds.project_id}/databases/(default)/documents/${collectionPath}?pageSize=300`;
  const res = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { documents?: FirestoreDocument[] };
  return (data.documents ?? []).map((d) => unwrapFirestoreFields(d.fields));
}

/** Fetch `tasks` and `budget` for a plan space (`users/{uid}` or `rooms/{roomId}`). */
export async function fetchPlanNotificationState(
  creds: ServiceAccountCredentials,
  accessToken: string,
  spacePath: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ tasks: Task[]; budget: BudgetItem[] }> {
  const [rawTasks, rawBudget] = await Promise.all([
    listCollectionDocs(creds, accessToken, `${spacePath}/tasks`, fetchImpl),
    listCollectionDocs(creds, accessToken, `${spacePath}/budget`, fetchImpl),
  ]);

  const tasks: Task[] = rawTasks.map((t) => ({
    id: String(t.id ?? ''),
    title: String(t.title ?? ''),
    done: Boolean(t.done),
    due: typeof t.due === 'string' ? t.due : '',
    cat: typeof t.cat === 'string' ? t.cat : '',
    created: typeof t.created === 'string' ? t.created : '',
  }));

  const budget: BudgetItem[] = rawBudget.map((b) => ({
    id: String(b.id ?? ''),
    item: String(b.item ?? ''),
    category: typeof b.category === 'string' ? b.category : '',
    estimated: Number(b.estimated) || 0,
    actual: Number(b.actual) || 0,
    paid: Boolean(b.paid),
  }));

  return { tasks, budget };
}

/** Delete an expired or unregistered push token document from Firestore. */
export async function deletePushTokenDoc(
  creds: ServiceAccountCredentials,
  accessToken: string,
  docPath: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${creds.project_id}/databases/(default)/documents/${docPath}`;
  await fetchImpl(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => {});
}

/** Dispatch a Web Push notification via the FCM HTTP v1 API. */
export async function sendFcmNotification(
  creds: ServiceAccountCredentials,
  accessToken: string,
  msg: FcmOutgoingMessage,
  fetchImpl: typeof fetch = fetch,
): Promise<'sent' | 'unregistered' | 'failed'> {
  const url = `https://fcm.googleapis.com/v1/projects/${creds.project_id}/messages:send`;
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token: msg.token,
        notification: {
          title: msg.title,
          body: msg.body,
        },
        data: {
          ...msg.data,
          url: msg.link,
        },
        webpush: {
          notification: {
            icon: '/icon.svg',
            badge: '/icon.svg',
          },
          fcm_options: {
            link: msg.link,
          },
        },
      },
    }),
  });

  if (res.ok) return 'sent';
  const errText = await res.text().catch(() => '');
  if (res.status === 404 || res.status === 410 || errText.includes('UNREGISTERED')) {
    return 'unregistered';
  }
  return 'failed';
}
