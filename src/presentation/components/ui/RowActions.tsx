import { IconButton } from './IconButton';
import { cn } from '@presentation/lib/cn';

interface RowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
  /** Reveal on row hover (default) vs. always visible. */
  className?: string;
}

/** Edit + delete pair, hidden until the parent `.group` is hovered. */
export function RowActions({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  className,
}: RowActionsProps) {
  return (
    <div
      className={cn(
        'flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100',
        className,
      )}
    >
      <IconButton icon="edit" onClick={onEdit} label={editLabel} />
      <IconButton icon="delete" onClick={onDelete} label={deleteLabel} danger />
    </div>
  );
}
