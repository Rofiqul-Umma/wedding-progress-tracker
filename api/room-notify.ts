import {
  deletePushTokenDoc,
  getAccessToken,
  getServerEnv,
  listRoomPushTokens,
  parseServiceAccount,
  sendFcmNotification,
  verifyFirebaseIdToken,
} from './_lib/firebaseAdmin';
import { buildRoomEventPush, createDualHandler } from './_lib/pushFormat';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

interface RoomNotifyBody {
  roomId?: unknown;
  actorUid?: unknown;
  actorName?: unknown;
  page?: unknown;
  itemTitle?: unknown;
  collection?: unknown;
}

const VALID_PAGES = new Set([
  'dashboard',
  'vendors',
  'budget',
  'tasks',
  'shopping',
  'seserahan',
  'contacts',
  'guests',
  'reports',
]);

export async function handleRoomNotifyRequest(
  request: Request,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  const env = getServerEnv();
  const creds = parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!creds) {
    return jsonResponse(
      { ok: false, error: 'FIREBASE_SERVICE_ACCOUNT_JSON is not configured' },
      503,
    );
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : '';
  if (!bearerToken) {
    return jsonResponse({ ok: false, error: 'Missing Authorization Bearer token' }, 401);
  }

  const verifiedUid = await verifyFirebaseIdToken(bearerToken, creds.project_id, fetchImpl);
  if (!verifiedUid) {
    return jsonResponse({ ok: false, error: 'Invalid Firebase ID token' }, 401);
  }

  let body: RoomNotifyBody;
  try {
    body = (await request.json()) as RoomNotifyBody;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const roomId = typeof body.roomId === 'string' ? body.roomId.trim() : '';
  if (!roomId || !/^[A-Za-z0-9_-]{4,128}$/.test(roomId)) {
    return jsonResponse({ ok: false, error: 'Invalid roomId' }, 400);
  }

  const actorName = typeof body.actorName === 'string' ? body.actorName.slice(0, 64) : '';
  const collection = typeof body.collection === 'string' ? body.collection.slice(0, 32) : 'plan';
  const itemTitle = typeof body.itemTitle === 'string' ? body.itemTitle.slice(0, 120) : '';
  const rawPage = typeof body.page === 'string' ? body.page : 'dashboard';
  const page = VALID_PAGES.has(rawPage) ? rawPage : 'dashboard';

  try {
    const accessToken = await getAccessToken(creds, fetchImpl);
    const subscribers = await listRoomPushTokens(creds, accessToken, roomId, fetchImpl);

    let sent = 0;
    let staleTokensRemoved = 0;
    const seenTokens = new Set<string>();

    for (const sub of subscribers) {
      // Skip notifying the collaborator who triggered the change.
      if (sub.docId === verifiedUid) continue;
      if (seenTokens.has(sub.token)) continue;
      seenTokens.add(sub.token);

      const { title, body: msgBody } = buildRoomEventPush(
        { actorName, collection, itemTitle, page },
        sub.lang,
      );

      const queryParams = new URLSearchParams({ room: roomId, page });
      const link = `/?${queryParams.toString()}`;

      const result = await sendFcmNotification(
        creds,
        accessToken,
        {
          token: sub.token,
          title,
          body: msgBody,
          link,
          data: {
            page,
            roomId,
            tag: `evermore-room-${roomId}`,
          },
        },
        fetchImpl,
      );

      if (result === 'sent') {
        sent++;
      } else if (result === 'unregistered') {
        await deletePushTokenDoc(creds, accessToken, sub.docPath, fetchImpl);
        staleTokensRemoved++;
      }
    }

    return jsonResponse({ ok: true, sent, staleTokensRemoved });
  } catch (err) {
    console.error('[room-notify]', err);
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : 'Internal error' },
      500,
    );
  }
}

export const POST = (request: Request) => handleRoomNotifyRequest(request);
export default createDualHandler((request) => handleRoomNotifyRequest(request));
