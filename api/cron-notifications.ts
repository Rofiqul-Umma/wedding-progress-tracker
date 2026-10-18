import {
  deletePushTokenDoc,
  fetchPlanNotificationState,
  getAccessToken,
  getServerEnv,
  listAllPushTokens,
  parseServiceAccount,
  sendFcmNotification,
  type StoredPushToken,
} from './_lib/firebaseAdmin';
import { buildReminderPush, createDualHandler } from './_lib/pushFormat';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function handleCronRequest(
  request: Request,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  const env = getServerEnv();
  if (env.CRON_SECRET) {
    const authHeader = request.headers.get('authorization') ?? '';
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }
  }

  const creds = parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!creds) {
    return jsonResponse(
      { ok: false, error: 'FIREBASE_SERVICE_ACCOUNT_JSON is not configured' },
      503,
    );
  }

  try {
    const accessToken = await getAccessToken(creds, fetchImpl);
    const allTokens = await listAllPushTokens(creds, accessToken, fetchImpl);

    const bySpace = new Map<string, StoredPushToken[]>();
    for (const entry of allTokens) {
      const group = bySpace.get(entry.spacePath) ?? [];
      group.push(entry);
      bySpace.set(entry.spacePath, group);
    }

    let notificationsSent = 0;
    let staleTokensRemoved = 0;

    for (const [spacePath, subscribers] of bySpace.entries()) {
      const planState = await fetchPlanNotificationState(
        creds,
        accessToken,
        spacePath,
        fetchImpl,
      );

      const isRoom = spacePath.startsWith('rooms/');
      const roomId = isRoom ? spacePath.slice('rooms/'.length) : null;

      // De-duplicate by FCM token within the same plan space so a device isn't notified twice.
      const seenTokens = new Set<string>();
      for (const sub of subscribers) {
        if (seenTokens.has(sub.token)) continue;
        seenTokens.add(sub.token);

        const content = buildReminderPush(
          planState,
          sub.lang,
          sub.currency,
          sub.tzOffsetMin,
        );
        if (!content) continue;

        const queryParams = new URLSearchParams();
        if (roomId) queryParams.set('room', roomId);
        queryParams.set('page', content.page);
        const link = `/?${queryParams.toString()}`;

        const result = await sendFcmNotification(
          creds,
          accessToken,
          {
            token: sub.token,
            title: content.title,
            body: content.body,
            link,
            data: {
              page: content.page,
              tag: `evermore-daily-${spacePath}`,
            },
          },
          fetchImpl,
        );

        if (result === 'sent') {
          notificationsSent++;
        } else if (result === 'unregistered') {
          await deletePushTokenDoc(creds, accessToken, sub.docPath, fetchImpl);
          staleTokensRemoved++;
        }
      }
    }

    return jsonResponse({
      ok: true,
      spacesChecked: bySpace.size,
      notificationsSent,
      staleTokensRemoved,
    });
  } catch (err) {
    console.error('[cron-notifications]', err);
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : 'Internal error' },
      500,
    );
  }
}

export const GET = (request: Request) => handleCronRequest(request);
export const POST = (request: Request) => handleCronRequest(request);
export default createDualHandler((request) => handleCronRequest(request));
