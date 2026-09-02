import type { AccountStatus } from '@presentation/state/AccountStore';
import type { RoomStatus } from '@presentation/state/RoomStore';

export type SyncOwner = 'local' | 'account' | 'room';

export function shouldResumeAccount(previous: SyncOwner, next: SyncOwner): boolean {
  return previous === 'room' && next === 'local';
}

/** Room ownership always wins, including before its first remote snapshot. */
export function selectSyncOwner(
  roomStatus: RoomStatus,
  accountStatus: AccountStatus,
): SyncOwner {
  if (roomStatus === 'connecting' || roomStatus === 'connected') return 'room';
  if (accountStatus === 'connected') return 'account';
  return 'local';
}
