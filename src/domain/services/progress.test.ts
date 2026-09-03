import { describe, it, expect } from 'vitest';
import type { SeserahanItem, Task, Vendor } from '@domain/entities/types';
import {
  tasksDone,
  openTasks,
  taskPct,
  sesDone,
  sesOpen,
  sesPct,
  contentsProgress,
  effectiveSeserahanStatus,
  vendorsBooked,
  vendorCategories,
} from './progress';

const task = (done: boolean): Task => ({
  id: 't' + Math.random(),
  title: '',
  due: '',
  done,
  cat: '',
  created: '',
});

const ses = (
  status: SeserahanItem['status'],
  contents: SeserahanItem['contents'] = [],
): SeserahanItem => ({
  id: 's' + Math.random(),
  name: '',
  category: '',
  qty: 1,
  cost: 0,
  status,
  contents,
  url: '',
  image: '',
  notes: '',
});

/** Shorthand for a bundle line; only `done` matters to these assertions. */
const content = (done: boolean) => ({
  id: 'c' + Math.random(),
  name: 'x',
  qty: 1,
  done,
});

const vendor = (status: Vendor['status'], category: string): Vendor => ({
  id: 'v' + Math.random(),
  name: '',
  category,
  contact: '',
  phone: '',
  social: '',
  cost: 0,
  items: [],
  status,
  notes: '',
});

describe('task progress', () => {
  const tasks = [task(true), task(true), task(false)];
  it('counts done, open, and percentage', () => {
    expect(tasksDone(tasks)).toBe(2);
    expect(openTasks(tasks)).toBe(1);
    expect(taskPct(tasks)).toBe(67);
  });
  it('returns 0% for an empty list', () => {
    expect(taskPct([])).toBe(0);
  });
});

describe('seserahan progress', () => {
  const items = [ses('finished'), ses('onProgress'), ses('pending'), ses('finished')];
  it('counts finished, open, and percentage', () => {
    expect(sesDone(items)).toBe(2);
    expect(sesOpen(items)).toBe(2);
    expect(sesPct(items)).toBe(50);
  });
  it('returns 0% for an empty list', () => {
    expect(sesPct([])).toBe(0);
  });
});

describe('seserahan bundles', () => {
  it('reports no progress for a tray without contents', () => {
    expect(contentsProgress(ses('pending'))).toBeNull();
  });

  it('counts ticked contents', () => {
    const item = ses('pending', [content(true), content(false), content(false)]);
    expect(contentsProgress(item)).toEqual({ done: 1, total: 3 });
  });

  it('keeps the hand-set status when there are no contents', () => {
    expect(effectiveSeserahanStatus(ses('onProgress'))).toBe('onProgress');
  });

  it('derives the status from the checklist', () => {
    expect(effectiveSeserahanStatus(ses('finished', [content(false), content(false)]))).toBe(
      'pending',
    );
    expect(effectiveSeserahanStatus(ses('pending', [content(true), content(false)]))).toBe(
      'onProgress',
    );
    expect(effectiveSeserahanStatus(ses('pending', [content(true), content(true)]))).toBe(
      'finished',
    );
  });

  it('counts a fully ticked bundle as done despite a stale stored status', () => {
    const items = [ses('pending', [content(true), content(true)]), ses('pending')];
    expect(sesDone(items)).toBe(1);
    expect(sesOpen(items)).toBe(1);
    expect(sesPct(items)).toBe(50);
  });
});

describe('vendor progress', () => {
  const vendors = [
    vendor('paid', 'Venue'),
    vendor('booked', 'Florals'),
    vendor('inquiry', 'Venue'),
  ];
  it('counts vendors past the inquiry stage', () => {
    expect(vendorsBooked(vendors)).toBe(2);
  });
  it('counts distinct categories', () => {
    expect(vendorCategories(vendors)).toBe(2);
  });
});
