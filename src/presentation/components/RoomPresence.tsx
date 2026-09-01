import { useTranslation } from 'react-i18next';
import { Avatar } from '@presentation/components/ui/Avatar';
import { useRoom } from '@presentation/state/RoomStore';

/** Max avatars to render before collapsing the rest into a "+N" badge. */
const MAX_AVATARS = 4;

/** Overlapping presence avatars for the current room's collaborators. */
export function RoomPresence() {
  const { t } = useTranslation();
  const { enabled, status, peers } = useRoom();

  if (!enabled || status !== 'connected' || peers.length === 0) return null;

  const shown = peers.slice(0, MAX_AVATARS);
  const extra = peers.length - shown.length;

  return (
    <div
      className="flex items-center max-[460px]:hidden"
      title={t('room.peers', { count: peers.length })}
      aria-label={t('room.peers', { count: peers.length })}
    >
      {shown.map((p, i) => (
        <div
          key={p.clientId}
          className="rounded-[13px] ring-2 ring-white"
          style={{ marginLeft: i === 0 ? 0 : -8 }}
        >
          <Avatar color={p.color} letter={p.name.charAt(0).toUpperCase()} size={30} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="grid h-[30px] w-[30px] place-items-center rounded-[11px] bg-panel text-[13px] font-bold text-muted ring-2 ring-white"
          style={{ marginLeft: -8 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
