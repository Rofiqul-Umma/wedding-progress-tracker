import { Icon } from './Icon';
import { cn } from '@presentation/lib/cn';

interface IconButtonProps {
  icon: string;
  onClick: () => void;
  label: string;
  danger?: boolean;
  className?: string;
}

/** Small 32px square icon button used for row edit/delete actions. */
export function IconButton({ icon, onClick, label, danger, className }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'grid h-8 w-8 flex-none place-items-center rounded-[9px] text-faint transition-colors',
        danger ? 'hover:bg-bad-soft hover:text-bad' : 'hover:bg-panel-2 hover:text-ink',
        className,
      )}
    >
      <Icon name={icon} size={18} />
    </button>
  );
}
