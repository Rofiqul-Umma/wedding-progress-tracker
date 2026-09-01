import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatStrip } from '@presentation/components/ui/StatStrip';
import { EmptyState } from '@presentation/components/ui/EmptyState';
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

  const visible = state.contacts.filter((c) => matches(`${c.name} ${c.role || ''}`));

  return (
    <>
      <StatStrip items={[{ label: t('contacts.strip'), value: state.contacts.length }]} />
      <div className="mt-[18px] grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {visible.map((c) => (
          <Card
            key={c.id}
            pad
            className={cn(
              'group relative',
              flashId === c.id && 'contact-flash',
            )}
          >
            <div
              ref={(el) => {
                refs.current[c.id] = el;
              }}
            >
              <div className="absolute right-2.5 top-3">
                <RowActions
                  onEdit={() => openForm(contactForm(c))}
                  onDelete={() => deleteContact(c.id)}
                  editLabel={t('contacts.editAria', { name: c.name })}
                  deleteLabel={t('contacts.deleteAria', { name: c.name })}
                />
              </div>
              <div className="flex items-center gap-3">
                <Avatar color={categoryColor(c.name)} letter={c.name[0] || '?'} />
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-bold">{c.name}</div>
                  <div className="mt-px text-xs font-bold text-lime-ink">
                    {c.role || t('contacts.role')}
                  </div>
                </div>
              </div>
              {c.phone && (
                <div className="mt-[9px] flex items-center gap-[9px] text-[13px] text-muted">
                  <Icon name="call" size={17} className="text-faint" />
                  <a href={`tel:${c.phone}`} className="hover:text-ink">
                    {c.phone}
                  </a>
                </div>
              )}
              {c.email && (
                <div className="mt-[9px] flex items-center gap-[9px] text-[13px] text-muted">
                  <Icon name="mail" size={17} className="text-faint" />
                  <a href={`mailto:${c.email}`} className="truncate hover:text-ink">
                    {c.email}
                  </a>
                </div>
              )}
              {c.notes && (
                <div className="mt-3 border-t border-dashed border-line-2 pt-3 text-[12.5px] text-faint">
                  {c.notes}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
