import { Icon } from './Icon';
import { cn } from '@presentation/lib/cn';

interface CheckProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

/** The square check toggle used for tasks and budget "paid" state. */
export function Check({ checked, onChange, label }: CheckProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      aria-label={label}
      className={cn(
        'relative grid min-h-6 min-w-6 flex-none place-items-center rounded-[7px] border-2 transition-all touch-manipulation [@media(pointer:coarse)]:min-h-7 [@media(pointer:coarse)]:min-w-7',
        checked
          ? 'border-lime bg-lime text-on-lime'
          : 'border-line-2 bg-app text-transparent hover:border-ink',
      )}
    >
      {checked && <Icon name="check" size={16} />}
    </button>
  );
}
