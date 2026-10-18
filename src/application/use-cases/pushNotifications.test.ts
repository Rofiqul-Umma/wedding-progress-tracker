import { describe, it, expect } from 'vitest';
import {
  buildReminderPush,
  buildRoomEventPush,
  subscriberLocalDate,
} from '../../../api/_lib/pushFormat';
import { handleCronRequest } from '../../../api/cron-notifications';
import { handleRoomNotifyRequest } from '../../../api/room-notify';

describe('push notification formatting & Vercel API handlers', () => {
  it('returns null when there are no overdue/due tasks or unpaid budget items', () => {
    const res = buildReminderPush(
      { tasks: [], budget: [] },
      'en',
      'USD',
      0,
      new Date('2026-10-18T10:00:00Z'),
    );
    expect(res).toBeNull();
  });

  it('formats English and Indonesian daily reminder notifications accurately', () => {
    const state = {
      tasks: [
        {
          id: 't1',
          title: 'Book catering',
          due: '2026-10-16',
          done: false,
          cat: 'Catering',
          created: '',
        },
        {
          id: 't2',
          title: 'Send invitations',
          due: '2026-10-20',
          done: false,
          cat: 'Invitations',
          created: '',
        },
      ],
      budget: [
        {
          id: 'b1',
          item: 'Venue deposit',
          category: 'Venue',
          estimated: 1000,
          actual: 500,
          paid: false,
        },
      ],
    };

    const nowUtc = new Date('2026-10-18T01:00:00Z');
    const enMsg = buildReminderPush(state, 'en', 'USD', 0, nowUtc);
    expect(enMsg).toEqual({
      title: 'Evermore · 3 wedding plan reminders',
      body: 'Book catering — 2 days overdue (+2 more)',
      page: 'tasks',
    });

    const idMsg = buildReminderPush(state, 'id', 'IDR', -420, nowUtc);
    expect(idMsg).toEqual({
      title: 'Evermore · 3 pengingat rencana pernikahan',
      body: 'Book catering — terlambat 2 hari (+2 lainnya)',
      page: 'tasks',
    });
  });

  it('computes subscriberLocalDate across timezone boundaries', () => {
    // 2026-10-18T20:00:00Z is already 2026-10-19 in UTC+7 (tzOffsetMin = -420)
    const d = subscriberLocalDate(-420, new Date('2026-10-18T20:00:00Z'));
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9); // October (0-indexed)
    expect(d.getDate()).toBe(19);
  });

  it('formats localized real-time room event notifications', () => {
    expect(
      buildRoomEventPush(
        {
          actorName: 'Rose',
          collection: 'tasks',
          itemTitle: 'Order wedding rings',
          page: 'tasks',
        },
        'en',
      ),
    ).toEqual({
      title: 'Rose updated Tasks',
      body: 'Order wedding rings',
    });

    expect(
      buildRoomEventPush(
        {
          actorName: 'Rose',
          collection: 'budget',
          itemTitle: 'Catering DP',
          page: 'budget',
        },
        'id',
      ),
    ).toEqual({
      title: 'Rose memperbarui Anggaran',
      body: 'Catering DP',
    });
  });

  it('rejects non-GET/POST methods on cron endpoint and missing config gracefully', async () => {
    const badMethod = await handleCronRequest(
      new Request('https://localhost/api/cron-notifications', { method: 'DELETE' }),
    );
    expect(badMethod.status).toBe(405);

    const unconfigured = await handleCronRequest(
      new Request('https://localhost/api/cron-notifications', { method: 'GET' }),
    );
    expect(unconfigured.status).toBe(503);
  });

  it('rejects non-POST methods on room-notify endpoint', async () => {
    const res = await handleRoomNotifyRequest(
      new Request('https://localhost/api/room-notify', { method: 'GET' }),
    );
    expect(res.status).toBe(405);
  });
});
