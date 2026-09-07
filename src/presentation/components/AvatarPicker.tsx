import { useTranslation } from 'react-i18next';
import { Icon } from '@presentation/components/ui/Icon';
import { CartoonAvatar } from '@presentation/components/ui/CartoonAvatar';
import {
  AVATAR_COLORS,
  AVATAR_FACES,
  parseAvatar,
  serializeAvatar,
  type AvatarColor,
} from '@domain/value-objects/avatars';
import { cn } from '@presentation/lib/cn';

const BTN =
  'inline-flex items-center gap-1.5 rounded-xl border border-line-2 bg-panel px-3 py-2 text-[13px] font-bold text-ink transition-colors hover:bg-white';

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
 * Pick a cartoon face and a background colour for one partner.
 *
 * Collapsed until asked for, like `IconField`: the grid is twelve tiles plus a
 * colour row and would otherwise push the rest of Settings off the screen. The
 * parent owns `open` so only one partner's grid can be expanded at a time.
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
  // Face tiles preview in the colour that's currently selected, so choosing a
  // face shows the final combination rather than a neutral swatch.
  const color: AvatarColor = choice?.color ?? 'lime';

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
              {AVATAR_FACES.map((face) => {
                const selected = choice?.face === face.id;
                return (
                  <button
                    key={face.id}
                    type="button"
                    aria-pressed={selected}
                    aria-label={t('settings.avatarPickFace', {
                      name: t(`avatars.face.${face.id}`),
                    })}
                    title={t(`avatars.face.${face.id}`)}
                    onClick={() => onChange(serializeAvatar({ face: face.id, color }))}
                    className={cn(
                      'grid h-[46px] w-[46px] place-items-center rounded-full border-2 transition-colors',
                      selected
                        ? 'border-lime'
                        : 'border-transparent hover:border-ink',
                    )}
                  >
                    <CartoonAvatar
                      value={serializeAvatar({ face: face.id, color })}
                      size={40}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-faint">
              {t('settings.avatarColor')}
            </span>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((c) => {
                const selected = color === c && !!choice;
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={selected}
                    aria-label={t('settings.avatarPickColor', {
                      color: t(`avatars.color.${c}`),
                    })}
                    title={t(`avatars.color.${c}`)}
                    // Without a face yet, picking a colour should still do
                    // something sensible — start from the first face.
                    onClick={() =>
                      onChange(
                        serializeAvatar({
                          face: choice?.face ?? AVATAR_FACES[0].id,
                          color: c,
                        }),
                      )
                    }
                    className={cn(
                      'grid h-[34px] w-[34px] place-items-center rounded-full border-2 transition-colors',
                      selected ? 'border-lime' : 'border-transparent hover:border-ink',
                    )}
                  >
                    <CartoonAvatar
                      value={serializeAvatar({
                        face: choice?.face ?? AVATAR_FACES[0].id,
                        color: c,
                      })}
                      size={28}
                    />
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
