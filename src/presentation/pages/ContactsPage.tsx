import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatStrip } from '@presentation/components/ui/StatStrip';
import { EmptyState, EmptyRow } from '@presentation/components/ui/EmptyState';
import { Select } from '@presentation/components/ui/Select';
import { Card } from '@presentation/components/ui/Card';
import { Avatar } from '@presentation/components/ui/Avatar';
import { RowActions } from '@presentation/components/ui/RowActions';
import { Icon } from '@presentation/components/ui/Icon';
import { usePlan } from '@presentation/state/PlanStore';
import { useNav, useSearchMatch } from '@presentation/state/NavStore';
import { useUi } from '@presentation/state/UiStore';
import { useForms } from '@presentation/hooks/useForms';
import { usePlanActions } from '@presentation/hooks/usePlanActions';
import { categoryColor } from '@domain/value-objects/status';
import { cn } from '@presentation/lib/cn';

export function ContactsPage() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { highlightContactId, consumeHighlight } = useNav();
  const { openForm } = useUi();
  const { contactForm } = useForms();
  const { deleteContact } = usePlanActions();
  const matches = useSearchMatch();

  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [flashId, setFlashId] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!highlightContactId) return;
    const id = highlightContactId;
    setFlashId(id);
    refs.current[id]?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    consumeHighlight();
    const timer = window.setTimeout(
      () => setFlashId((cur) => (cur === id ? null : cur)),
      1900,
    );
    return () => window.clearTimeout(timer);
  }, [highlightContactId, consumeHighlight]);

  if (!state.contacts.length) {
    return (
      <>
        <StatStrip items={[{ label: t('contacts.strip'), value: 0 }]} />
        <EmptyState
          icon="contacts"
          title={t('contacts.emptyTitle')}
          text={t('contacts.emptyText')}
          actionLabel={t('topbar.addContact')}
          onAction={() => openForm(contactForm())}
        />
      </>
    );
  }

  const roleCounts = new Map<string, number>();
  for (const c of state.contacts) {
    const r = c.role?.trim() || '';
    if (r) roleCounts.set(r, (roleCounts.get(r) ?? 0) + 1);
  }
  const roleOptions = [
    { value: 'all', label: `${t('contacts.roleAll')} (${state.contacts.length})` },
    ...[...roleCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([role, count]) => ({
        value: role,
        label: `${role} (${count})`,
      })),
  ];

  const visible = state.contacts
    .filter((c) => roleFilter === 'all' || (c.role?.trim() || '') === roleFilter)
    .filter((c) => matches(`${c.name} ${c.role || ''}`));

  return (
    <>
      <StatStrip items={[{ label: t('contacts.strip'), value: state.contacts.length }]} />
      {roleCounts.size > 0 && (
        <div className="mt-3.5 flex items-center justify-end max-[560px]:mt-2.5">
          <Select
            id="contactRoleFilter"
            variant="compact"
            value={roleFilter}
            aria-label={t('contacts.filterRoleAria')}
            options={roleOptions}
            containerClassName="max-[560px]:w-full"
            onChange={(e) => setRoleFilter(e.target.value)}
          />
        </div>
      )}
      {visible.length ? (
        <div className="mt-[18px] grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3.5 max-[560px]:mt-3 max-[560px]:gap-2">
          {visible.map((c) => (
          <Card
            key={c.id}
            pad
            className={cn(
              'group relative max-[560px]:p-3.5',
              flashId === c.id && 'contact-flash',
            )}
          >
            <div
              ref={(el) => {
                refs.current[c.id] = el;
              }}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <Avatar color={categoryColor(c.name)} letter={c.name[0] || '?'} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-bold">{c.name}</div>
                    <div className="mt-px text-xs font-bold text-lime-ink">
                      {c.role || t('contacts.role')}
                    </div>
                  </div>
                </div>
                <RowActions
                  onEdit={() => openForm(contactForm(c))}
                  onDelete={() => deleteContact(c.id)}
                  editLabel={t('contacts.editAria', { name: c.name })}
                  deleteLabel={t('contacts.deleteAria', { name: c.name })}
                />
              </div>
              {(c.phone || c.social) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-muted">
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="inline-flex items-center gap-1.5 hover:text-ink"
                    >
                      <Icon name="call" size={14} className="text-faint" />
                      {c.phone}
                    </a>
                  )}
                  {c.social && (
                    <a
                      href={/^https?:\/\//i.test(c.social) ? c.social : `https://${c.social}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-1.5 truncate hover:text-ink"
                    >
                      <Icon name="public" size={14} className="flex-none text-faint" />
                      <span className="truncate">{c.social}</span>
                    </a>
                  )}
                </div>
              )}
              {c.notes && (
                <div className="mt-2 border-t border-line pt-2 text-[12px] text-faint line-clamp-1">
                  {c.notes}
                </div>
              )}
            </div>
          </Card>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <EmptyRow>{t('contacts.noFilter')}</EmptyRow>
        </div>
      )}
    </>
  );
}
