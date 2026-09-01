import { describe, it, expect } from 'vitest';
import type { Task, Wedding } from '@domain/entities/types';
import { daysUntil, taskCountdown, getNotifications } from './schedule';

const NOW = new Date('2026-06-15T12:00:00');
const wedding: Wedding = {
  p1: 'A',
  p2: 'B',
  date: '2026-09-14',
  venue: '',
  budget: 0,
};

const task = (over: Partial<Task> = {}): Task => ({
  id: 't' + Math.random(),
  title: 'Task',
  due: '',
  done: false,
  cat: '',
  created: '09:00 AM',
  ...over,
});

describe('daysUntil', () => {
  it('returns null for an empty date', () => {
    expect(daysUntil('', NOW)).toBeNull();
  });
  it('returns 0 for today', () => {
    expect(daysUntil('2026-06-15', NOW)).toBe(0);
  });
  it('returns a positive count for the future', () => {
    expect(daysUntil('2026-06-20', NOW)).toBe(5);
  });
  it('returns a negative count for the past', () => {
    expect(daysUntil('2026-06-10', NOW)).toBe(-5);
  });
});

describe('taskCountdown', () => {
  it('marks a completed task as done', () => {
    const info = taskCountdown(task({ done: true, due: '2026-06-20' }), wedding, NOW);
    expect(info.kind).toBe('done');
    expect(info.days).toBeNull();
    expect(info.urgency).toBe(100);
  });

  it('marks a task without a due date as none', () => {
    const info = taskCountdown(task({ due: '' }), wedding, NOW);
    expect(info.kind).toBe('none');
    expect(info.days).toBeNull();
  });

  it('reports overdue tasks with an absolute day count', () => {
    const info = taskCountdown(task({ due: '2026-06-10' }), wedding, NOW);
    expect(info.kind).toBe('overdue');
    expect(info.days).toBe(5);
  });

  it('reports a task due today', () => {
    const info = taskCountdown(task({ due: '2026-06-15' }), wedding, NOW);
    expect(info.kind).toBe('today');
    expect(info.days).toBe(0);
    expect(info.soon).toBe(true);
  });

  it('flags upcoming tasks within 14 days as soon', () => {
    expect(taskCountdown(task({ due: '2026-06-20' }), wedding, NOW).soon).toBe(true);
    expect(taskCountdown(task({ due: '2026-08-01' }), wedding, NOW).soon).toBe(false);
  });

  it('describes the gap to the wedding day', () => {
    const before = taskCountdown(task({ due: '2026-06-20' }), wedding, NOW);
    expect(before.note?.kind).toBe('before');
    const onDay = taskCountdown(task({ due: '2026-09-14' }), wedding, NOW);
    expect(onDay.note?.kind).toBe('onDay');
    const after = taskCountdown(task({ due: '2026-10-01' }), wedding, NOW);
    expect(after.note?.kind).toBe('after');
  });
});

describe('getNotifications', () => {
  it('surfaces overdue and soon tasks plus outstanding payments, sorted', () => {
    const state = {
      tasks: [
        task({ title: 'Overdue', due: '2026-06-10' }),
        task({ title: 'Soon', due: '2026-06-18' }),
        task({ title: 'Far', due: '2026-08-30' }),
        task({ title: 'Done', due: '2026-06-01', done: true }),
      ],
      budget: [
        { id: 'b1', category: 'Cake', item: 'Cake', estimated: 0, actual: 900, paid: false },
        { id: 'b2', category: 'Venue', item: 'Venue', estimated: 0, actual: 100, paid: true },
      ],
    };
    const notes = getNotifications(state, NOW);
    const titles = notes.map((n) => n.title);
    expect(titles).toContain('Overdue');
    expect(titles).toContain('Soon');
    expect(titles).not.toContain('Far');
    expect(titles).not.toContain('Done');
    // overdue sorts first (negative sort key), payment last (sort 1000)
    expect(notes[0].title).toBe('Overdue');
    expect(notes[notes.length - 1].message.key).toBe('notif.outstanding');
  });

  it('ignores paid or zero-value payments', () => {
    const notes = getNotifications({
      tasks: [],
      budget: [{ id: 'b', category: '', item: 'x', estimated: 0, actual: 0, paid: false }],
    });
    expect(notes).toHaveLength(0);
  });
});
