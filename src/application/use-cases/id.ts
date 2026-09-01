/** Generate a short, collision-unlikely id (matches the legacy scheme). */
export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}
