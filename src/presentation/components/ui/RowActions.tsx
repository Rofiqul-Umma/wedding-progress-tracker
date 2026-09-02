import { IconButton } from './IconButton';
import { cn } from '@presentation/lib/cn';

interface RowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
  /**
   * Hide entirely on narrow screens (≤520px). Use where the row opens a preview
   * that already offers Edit/Delete, so the inline pair only clutters mobile.
   */
  mobileHidden?: boolean;
  /** Reveal on row hover (default) vs. always visible. */
  className?: string;
}

/**
 * Edit + delete pair. Hidden until the parent `.group` is hovered on pointer
 * devices; always visible on touch devices, which have no hover state.
 */
export function RowActions({
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  mobileHidden,
  className,
}: RowActionsProps) {
  return (
    <div
      className={cn(
        'flex flex-none gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100',
        mobileHidden && 'max-[520px]:hidden',
        className,
      )}
    >
      <IconButton icon="edit" onClick={onEdit} label={editLabel} />
      <IconButton icon="delete" onClick={onDelete} label={deleteLabel} danger />
    </div>
  );
}
