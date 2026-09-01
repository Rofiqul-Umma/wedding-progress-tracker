import { useEffect } from 'react';
import { usePlan } from '@presentation/state/PlanStore';
import { useRoom } from '@presentation/state/RoomStore';

/**
 * Null-rendering bridge between the plan store and the room connection.
 *
 * - Remote snapshots flow in through `registerRemoteState` → `setState`.
 * - Local edits flow out: every `state` change calls `connection.save(state)`,
 *   which diffs against the connection's own baseline and no-ops on echoes and
 *   before hydration. All echo/hydration guarding lives in the connection, so
 *   this component stays intentionally thin.
 */
export function RoomSync() {
  const { state, setState } = usePlan();
  const { connection, registerRemoteState } = useRoom();

  useEffect(() => {
    registerRemoteState(setState);
    return () => registerRemoteState(null);
  }, [registerRemoteState, setState]);

  useEffect(() => {
    connection?.save(state);
  }, [connection, state]);

  return null;
}
