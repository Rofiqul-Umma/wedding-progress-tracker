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
        'grid h-[22px] w-[22px] flex-none place-items-center rounded-[7px] border-2 transition-all',
        checked
          ? 'border-lime bg-lime text-ink'
          : 'border-line-2 bg-app text-transparent hover:border-ink',
      )}
    >
      {checked && <Icon name="check" size={16} />}
    </button>
  );
}
