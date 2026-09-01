import { describe, it, expect } from 'vitest';
import type { PlanState, ShoppingItem } from '@domain/entities/types';
import { insertInto, removeFrom } from './_collection';
import { addVendor, updateVendor, deleteVendor, insertVendor } from './vendors';
import {
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  insertBudgetItem,
  toggleBudgetPaid,
} from './budget';
import {
  addTask,
  updateTask,
  deleteTask,
  insertTask,
  toggleTaskDone,
} from './tasks';
import {
  addSeserahan,
  deleteSeserahan,
  cycleSeserahanStatus,
} from './seserahan';
import {
  addShopping,
  updateShopping,
  deleteShopping,
  insertShopping,
  cycleShoppingStatus,
} from './shopping';
import { addContact, deleteContact } from './contacts';

function base(): PlanState {
  return {
    settings: { currency: 'USD', lang: 'en' },
    wedding: { p1: 'A', p2: 'B', date: '', venue: '', budget: 0 },
    vendors: [],
    budget: [],
    tasks: [],
    seserahan: [],
    shopping: [],
    contacts: [],
  };
}

function shopInput(over: Partial<Omit<ShoppingItem, 'id'>> = {}): Omit<ShoppingItem, 'id'> {
  return {
    name: 'Item',
    category: '',
    store: '',
    price: 0,
    qty: 1,
    status: 'toBuy',
    url: '',
    image: '',
    notes: '',
    ...over,
  };
}

describe('_collection helpers', () => {
  it('removeFrom returns the removed item and its index', () => {
    const r = removeFrom([{ id: 'a' }, { id: 'b' }, { id: 'c' }], 'b');
    expect(r.removed).toEqual({ id: 'b' });
    expect(r.index).toBe(1);
    expect(r.list).toEqual([{ id: 'a' }, { id: 'c' }]);
  });
  it('removeFrom reports a miss with index -1', () => {
    const r = removeFrom([{ id: 'a' }], 'zzz');
    expect(r.removed).toBeNull();
    expect(r.index).toBe(-1);
  });
  it('insertInto restores an item at its original index (clamped)', () => {
    expect(insertInto(['a', 'c'], 'b', 1)).toEqual(['a', 'b', 'c']);
    expect(insertInto(['a'], 'z', 99)).toEqual(['a', 'z']);
  });
});

describe('vendor use cases', () => {
  it('adds a vendor with a generated id', () => {
    const s = addVendor(base(), {
      name: 'Ivy Barn',
      category: 'Venue',
      contact: '',
      phone: '',
      email: '',
      cost: 100,
      status: 'inquiry',
      notes: '',
    });
    expect(s.vendors).toHaveLength(1);
    expect(s.vendors[0].id).toBeTruthy();
    expect(s.vendors[0].name).toBe('Ivy Barn');
  });

  it('updates a vendor by id without touching others', () => {
    let s = addVendor(base(), {
      name: 'A',
      category: 'Venue',
      contact: '',
      phone: '',
      email: '',
      cost: 0,
      status: 'inquiry',
      notes: '',
    });
    const id = s.vendors[0].id;
    s = updateVendor(s, id, { status: 'booked', cost: 500 });
    expect(s.vendors[0].status).toBe('booked');
    expect(s.vendors[0].cost).toBe(500);
    expect(s.vendors[0].name).toBe('A');
  });

  it('deletes then restores a vendor at its original index (undo)', () => {
    let s = base();
    for (const name of ['A', 'B', 'C']) {
      s = addVendor(s, {
        name,
        category: '',
        contact: '',
        phone: '',
        email: '',
        cost: 0,
        status: 'inquiry',
        notes: '',
      });
    }
    const target = s.vendors[1];
    const r = deleteVendor(s, target.id);
    expect(r.removed).toEqual(target);
    expect(r.index).toBe(1);
    expect(r.state.vendors.map((v) => v.name)).toEqual(['A', 'C']);

    const restored = insertVendor(r.state, r.removed!, r.index);
    expect(restored.vendors.map((v) => v.name)).toEqual(['A', 'B', 'C']);
  });
});

describe('budget use cases', () => {
  it('adds, updates, and toggles paid', () => {
    let s = addBudgetItem(base(), {
      category: 'Cake',
      item: 'Cake',
      estimated: 900,
      actual: 800,
      paid: false,
    });
    const id = s.budget[0].id;
    s = updateBudgetItem(s, id, { actual: 850 });
    expect(s.budget[0].actual).toBe(850);
    s = toggleBudgetPaid(s, id);
    expect(s.budget[0].paid).toBe(true);
    s = toggleBudgetPaid(s, id);
    expect(s.budget[0].paid).toBe(false);
  });

  it('deletes then restores a budget item (undo)', () => {
    let s = base();
    for (const it of ['x', 'y']) {
      s = addBudgetItem(s, {
        category: '',
        item: it,
        estimated: 0,
        actual: 0,
        paid: false,
      });
    }
    const target = s.budget[0];
    const r = deleteBudgetItem(s, target.id);
    expect(r.state.budget.map((b) => b.item)).toEqual(['y']);
    const restored = insertBudgetItem(r.state, r.removed!, r.index);
    expect(restored.budget.map((b) => b.item)).toEqual(['x', 'y']);
  });
});

describe('task use cases', () => {
  it('adds a task with done:false and the provided created time', () => {
    const s = addTask(base(), { title: 'T', due: '', cat: 'Cat' }, '09:05 AM');
    expect(s.tasks[0].done).toBe(false);
    expect(s.tasks[0].created).toBe('09:05 AM');
    expect(s.tasks[0].id).toBeTruthy();
  });

  it('toggles done state', () => {
    let s = addTask(base(), { title: 'T', due: '', cat: '' }, '09:00 AM');
    const id = s.tasks[0].id;
    s = toggleTaskDone(s, id);
    expect(s.tasks[0].done).toBe(true);
    s = toggleTaskDone(s, id);
    expect(s.tasks[0].done).toBe(false);
  });

  it('updates and restores a task (undo)', () => {
    let s = addTask(base(), { title: 'Keep', due: '', cat: '' }, '09:00 AM');
    s = addTask(s, { title: 'Drop', due: '', cat: '' }, '10:00 AM');
    const target = s.tasks[1];
    s = updateTask(s, s.tasks[0].id, { title: 'Kept' });
    expect(s.tasks[0].title).toBe('Kept');

    const r = deleteTask(s, target.id);
    expect(r.state.tasks.map((t) => t.title)).toEqual(['Kept']);
    const restored = insertTask(r.state, r.removed!, r.index);
    expect(restored.tasks.map((t) => t.title)).toEqual(['Kept', 'Drop']);
  });
});

describe('seserahan use cases', () => {
  it('adds and cycles status through the lifecycle', () => {
    let s = addSeserahan(base(), {
      name: 'Kebaya',
      category: 'Busana',
      qty: 1,
      cost: 0,
      status: 'pending',
      notes: '',
    });
    const id = s.seserahan[0].id;
    s = cycleSeserahanStatus(s, id);
    expect(s.seserahan[0].status).toBe('onProgress');
    s = cycleSeserahanStatus(s, id);
    expect(s.seserahan[0].status).toBe('finished');
    s = cycleSeserahanStatus(s, id);
    expect(s.seserahan[0].status).toBe('pending');
  });

  it('deletes and reports the removed item', () => {
    const s = addSeserahan(base(), {
      name: 'X',
      category: '',
      qty: 1,
      cost: 0,
      status: 'pending',
      notes: '',
    });
    const r = deleteSeserahan(s, s.seserahan[0].id);
    expect(r.removed?.name).toBe('X');
    expect(r.state.seserahan).toHaveLength(0);
  });
});

describe('shopping use cases', () => {
  it('adds a shopping item with a generated id', () => {
    const s = addShopping(base(), shopInput({ name: 'String lights' }));
    expect(s.shopping).toHaveLength(1);
    expect(s.shopping[0].id).toBeTruthy();
    expect(s.shopping[0].name).toBe('String lights');
    expect(s.shopping[0].status).toBe('toBuy');
  });

  it('updates an item by id without touching others', () => {
    let s = addShopping(base(), shopInput({ name: 'A' }));
    s = addShopping(s, shopInput({ name: 'B' }));
    const id = s.shopping[0].id;
    s = updateShopping(s, id, { price: 250, store: 'Etsy' });
    expect(s.shopping[0].price).toBe(250);
    expect(s.shopping[0].store).toBe('Etsy');
    expect(s.shopping[1].name).toBe('B');
  });

  it('cycles status through the three-stage lifecycle and wraps', () => {
    let s = addShopping(base(), shopInput());
    const id = s.shopping[0].id;
    s = cycleShoppingStatus(s, id);
    expect(s.shopping[0].status).toBe('ordered');
    s = cycleShoppingStatus(s, id);
    expect(s.shopping[0].status).toBe('purchased');
    s = cycleShoppingStatus(s, id);
    expect(s.shopping[0].status).toBe('toBuy');
  });

  it('deletes then restores an item at its original index (undo)', () => {
    let s = base();
    for (const name of ['A', 'B', 'C']) {
      s = addShopping(s, shopInput({ name }));
    }
    const target = s.shopping[1];
    const r = deleteShopping(s, target.id);
    expect(r.removed).toEqual(target);
    expect(r.index).toBe(1);
    expect(r.state.shopping.map((i) => i.name)).toEqual(['A', 'C']);

    const restored = insertShopping(r.state, r.removed!, r.index);
    expect(restored.shopping.map((i) => i.name)).toEqual(['A', 'B', 'C']);
  });
});

describe('contact use cases', () => {
  it('adds and deletes a contact', () => {
    const s = addContact(base(), {
      name: 'Renee',
      role: 'Coordinator',
      phone: '',
      email: '',
      notes: '',
    });
    expect(s.contacts[0].name).toBe('Renee');
    const r = deleteContact(s, s.contacts[0].id);
    expect(r.removed?.name).toBe('Renee');
    expect(r.state.contacts).toHaveLength(0);
  });
});
