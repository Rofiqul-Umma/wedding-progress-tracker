import { useTranslation } from 'react-i18next';
import { Icon } from '@presentation/components/ui/Icon';
import { CartoonAvatar } from '@presentation/components/ui/CartoonAvatar';
import {
  AVATAR_FACE_LIST,
  parseAvatar,
  serializeAvatar,
} from '@domain/value-objects/avatars';
import { cn } from '@presentation/lib/cn';

const BTN =
  'inline-flex items-center gap-1.5 rounded-xl border border-line-2 bg-panel px-3 py-2 text-[13px] font-bold text-ink transition-colors hover:bg-app';

interface AvatarPickerProps {
  /** The partner's name (or the slot label when unnamed). */
  label: string;
  /** Initial shown while no avatar is chosen. */
  letter: string;
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  onToggle: () => void;
}

/**
 * Pick an illustrated portrait for one partner.
 *
 * Collapsed until asked for, like `IconField`: the grid would otherwise push
 * the rest of Settings off the screen. The parent owns `open` so only one
 * partner's grid can be expanded at a time.
 *
 * There is no colour or skin row — the background and skin tone are part of
 * each portrait, so the choice is a single tap.
 */
export function AvatarPicker({
  label,
  letter,
  value,
  onChange,
  open,
  onToggle,
}: AvatarPickerProps) {
  const { t } = useTranslation();
  const choice = parseAvatar(value);

  return (
    <div className="grid gap-2.5 rounded-[12px] border border-line bg-panel/40 p-3">
      <div className="flex items-center gap-2.5">
        <CartoonAvatar value={value} letter={letter} size={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold">{label}</span>
          <span className="block text-xs text-muted">
            {choice ? t(`avatars.face.${choice.face}`) : t('settings.avatarNone')}
          </span>
        </span>
        <button type="button" className={BTN} aria-expanded={open} onClick={onToggle}>
          <Icon name={open ? 'close' : 'edit'} size={17} />
          {open ? t('settings.avatarDone') : t('settings.avatarChange')}
        </button>
      </div>

      {open && (
        <>
          <div className="grid gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-faint">
              {t('settings.avatarFace')}
            </span>
            <div className="flex flex-wrap gap-2">
              {AVATAR_FACE_LIST.map((id) => {
                const selected = choice?.face === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={selected}
                    aria-label={t('settings.avatarPickFace', {
                      name: t(`avatars.face.${id}`),
                    })}
                    title={t(`avatars.face.${id}`)}
                    onClick={() => onChange(serializeAvatar({ face: id }))}
                    className={cn(
                      'grid h-[56px] w-[56px] place-items-center rounded-full border-2 transition-colors',
                      selected ? 'border-lime' : 'border-transparent hover:border-ink',
                    )}
                  >
                    <CartoonAvatar value={id} size={48} />
                  </button>
                );
              })}
            </div>
          </div>

          {choice && (
            <div>
              <button
                type="button"
                className={cn(BTN, 'text-bad')}
                onClick={() => onChange('')}
              >
                <Icon name="close" size={17} />
                {t('settings.avatarRemove')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
