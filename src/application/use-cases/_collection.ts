/** Immutable array helpers shared by the entity use cases. */

export interface WithId {
  id: string;
}

export interface Removal<T> {
  list: T[];
  removed: T | null;
  index: number;
}

export const addTo = <T>(list: T[], item: T): T[] => [...list, item];

export const updateIn = <T extends WithId>(
  list: T[],
  id: string,
  patch: Partial<T>,
): T[] => list.map((x) => (x.id === id ? { ...x, ...patch } : x));

export function removeFrom<T extends WithId>(list: T[], id: string): Removal<T> {
  const index = list.findIndex((x) => x.id === id);
  if (index < 0) return { list, removed: null, index: -1 };
  return {
    list: [...list.slice(0, index), ...list.slice(index + 1)],
    removed: list[index],
    index,
  };
}

/** Insert `item` at `index` (clamped into range). Used for delete-undo. */
export function insertInto<T>(list: T[], item: T, index: number): T[] {
  const i = Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, i), item, ...list.slice(i)];
}
