import { Icon } from './Icon';
import { Button } from './Button';
import { Card } from './Card';

interface EmptyStateProps {
  icon: string;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Full "nothing here yet" block shown when a collection is empty. */
export function EmptyState({
  icon,
  title,
  text,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className="mt-[18px]">
      <div className="px-6 py-[46px] text-center text-faint">
        <div className="mx-auto mb-3.5 grid h-[54px] w-[54px] place-items-center rounded-[16px] bg-lime-soft text-lime-ink">
          <Icon name={icon} size={25} />
        </div>
        <h3 className="text-base font-bold text-muted">{title}</h3>
        <p className="mx-0 mb-4 mt-1.5 text-sm">{text}</p>
        {actionLabel && onAction && (
          <Button variant="primary" icon="add" onClick={onAction} className="mx-auto">
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}

/** Compact single-line empty message used inside filtered lists. */
export function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3.5 py-[22px] text-center text-[13.5px] text-faint">
      {children}
    </div>
  );
}
