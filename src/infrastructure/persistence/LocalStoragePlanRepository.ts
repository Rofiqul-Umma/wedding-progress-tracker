import type { PlanState } from '@domain/entities/types';
import type { PlanRepository } from '@domain/repositories/PlanRepository';
import { STORE_KEY } from './storeKey';
import { migrate } from './migrate';

/** PlanRepository backed by the browser's localStorage. */
export class LocalStoragePlanRepository implements PlanRepository {
  load(): PlanState {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return migrate(JSON.parse(raw));
    } catch {
      /* fall through to an empty plan */
    }
    // First run (or unreadable storage): start with a blank plan. The sample
    // data is opt-in via Settings → "Load sample plan".
    const s = migrate({});
    this.save(s);
    return s;
  }

  save(state: PlanState): void {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      // Most likely the ~5MB quota was exceeded by large inline attachments.
      // Non-fatal: warn so it's diagnosable, but don't crash the app.
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn(
          'Evermore: localStorage quota exceeded — recent changes were not saved. ' +
            'Try removing large image/file attachments.',
        );
      }
      /* storage unavailable — ignore */
    }
  }
}
