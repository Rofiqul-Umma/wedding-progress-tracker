import { describe, it, expect } from 'vitest';
import type { SeserahanItem, Task, Vendor } from '@domain/entities/types';
import {
  tasksDone,
  openTasks,
  taskPct,
  sesDone,
  sesOpen,
  sesPct,
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

const ses = (status: SeserahanItem['status']): SeserahanItem => ({
  id: 's' + Math.random(),
  name: '',
  category: '',
  qty: 1,
  cost: 0,
  status,
  url: '',
  image: '',
  notes: '',
});

const vendor = (status: Vendor['status'], category: string): Vendor => ({
  id: 'v' + Math.random(),
  name: '',
  category,
  contact: '',
  phone: '',
  social: '',
  cost: 0,
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
