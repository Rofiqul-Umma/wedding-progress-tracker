import { useEffect, useRef } from 'react';
import { usePlan } from '@presentation/state/PlanStore';
import { useRoom } from '@presentation/state/RoomStore';
import { useAccount } from '@presentation/state/AccountStore';
import {
  selectSyncOwner,
  shouldResumeAccount,
  type SyncOwner,
} from '@application/use-cases/syncOwner';

/**
 * The only bridge between remote connections and PlanStore. Explicit ownership
 * prevents account and room snapshots from ever hydrating or saving together.
 */
export function SyncCoordinator() {
  const { state, setState } = usePlan();
  const room = useRoom();
  const account = useAccount();
  const {
    status: roomStatus,
    connection: roomConnection,
    registerRemoteState: registerRoomState,
  } = room;
  const {
    status: accountStatus,
    connection: accountConnection,
    registerRemoteState: registerAccountState,
    pause,
    resume,
  } = account;
  const stateRef = useRef(state);
  stateRef.current = state;

  const owner = selectSyncOwner(roomStatus, accountStatus);
  const roomOwns = owner === 'room';
  const previousOwner = useRef<SyncOwner>('local');

  useEffect(() => {
    const previous = previousOwner.current;
    previousOwner.current = owner;
    if (roomOwns) {
      pause();
      return;
    }
    if (shouldResumeAccount(previous, owner)) void resume(stateRef.current);
  }, [owner, pause, resume, roomOwns]);

  useEffect(() => {
    registerRoomState(owner === 'room' ? setState : null);
    registerAccountState(owner === 'account' ? setState : null);
    return () => {
      registerRoomState(null);
      registerAccountState(null);
    };
  }, [owner, registerAccountState, registerRoomState, setState]);

  useEffect(() => {
    if (owner === 'room') roomConnection?.save(state);
    if (owner === 'account') accountConnection?.save(state);
  }, [accountConnection, owner, roomConnection, state]);

  return null;
}
