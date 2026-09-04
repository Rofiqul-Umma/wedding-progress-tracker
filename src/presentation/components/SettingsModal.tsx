import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalShell } from '@presentation/components/ui/ModalShell';
import { Button } from '@presentation/components/ui/Button';
import { Chip } from '@presentation/components/ui/Chip';
import { Icon } from '@presentation/components/ui/Icon';
import { CONTROL, LABEL } from '@presentation/components/forms/FormField';
import { usePlan } from '@presentation/state/PlanStore';
import { useRoom } from '@presentation/state/RoomStore';
import { useAccount } from '@presentation/state/AccountStore';
import { useNav } from '@presentation/state/NavStore';
import { useToast } from '@presentation/hooks/useToast';
import { usePlanActions } from '@presentation/hooks/usePlanActions';
import { saveSettings } from '@application/use-cases/settings';
import { CURRENCIES } from '@infrastructure/format/money';
import { downloadBlob, planFileSlug } from '@presentation/lib/download';
import { serializePlan } from '@application/use-cases/data';
import type { Lang } from '@domain/entities/types';
import type { PlanBackupMeta } from '@infrastructure/persistence/PlanBackupRepository';
import { cn } from '@presentation/lib/cn';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { state, setState } = usePlan();
  const room = useRoom();
  const account = useAccount();
  const { go } = useNav();
  const toast = useToast();
  const { exportData, importData, loadSample, clearAll } = usePlanActions();
  const fileRef = useRef<HTMLInputElement>(null);

  const [joinInput, setJoinInput] = useState('');
  const [backupsOpen, setBackupsOpen] = useState(false);
  const inRoom = room.enabled && room.status === 'connected';

  const [currency, setCurrency] = useState(state.settings.currency);
  const [lang, setLang] = useState<Lang>(state.settings.lang);
  const [p1, setP1] = useState(state.wedding.p1);
  const [p2, setP2] = useState(state.wedding.p2);
  const [date, setDate] = useState(state.wedding.date);
  const [budget, setBudget] = useState(String(state.wedding.budget || ''));
  const [venue, setVenue] = useState(state.wedding.venue);

  function save() {
    setState((s) =>
      saveSettings(s, {
        settings: { currency: currency || 'USD', lang },
        wedding: {
          p1,
          p2,
          date,
          venue,
          budget: parseFloat(budget) || 0,
        },
      }),
    );
    onClose();
    // Resolve in the newly-chosen language: i18next hasn't switched yet this tick.
    toast(t('toast.settingsSaved', { lng: lang }));
  }

  function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    importData(file, () => {
      onClose();
      go('dashboard');
    });
    e.target.value = '';
  }

  function onSample() {
    if (window.confirm(t(inRoom ? 'settings.confirmSampleRoom' : 'settings.confirmSample'))) {
      loadSample();
      onClose();
      go('dashboard');
    }
  }

  function onClear() {
    if (window.confirm(t(inRoom ? 'settings.confirmClearRoom' : 'settings.confirmClear'))) {
      clearAll();
      onClose();
      go('dashboard');
    }
  }

  function onCreateRoom() {
    void room.createRoom(state, account.pause);
  }

  function onJoinRoom() {
    const raw = joinInput.trim();
    if (!raw) return;
    // Accept either a full share URL or a bare room id.
    let id = raw;
    try {
      const url = new URL(raw);
      id = url.searchParams.get('room') ?? raw;
    } catch {
      /* not a URL — treat as a bare id */
    }
    void room.join(id, account.pause);
    setJoinInput('');
  }

  async function onCopyLink() {
    if (await room.copyLink()) toast(t('room.linkCopied'));
  }

  function onRestoreBackup(backup: PlanBackupMeta) {
    if (!window.confirm(t('account.confirmRestore'))) return;
    const restored = account.restoreBackup(backup.key);
    if (!restored) return;
    setState(restored);
    toast(t('account.restored'));
    onClose();
    go('dashboard');
  }

  function onDownloadBackup(backup: PlanBackupMeta) {
    const restored = account.restoreBackup(backup.key);
    if (!restored) return;
    downloadBlob(
      serializePlan(restored),
      `evermore-safety-${planFileSlug(restored)}-${backup.createdAt}.json`,
      'application/json;charset=utf-8',
    );
    toast(t('account.downloaded'));
  }

  const accountBusy =
    account.status === 'loading' ||
    account.status === 'signingIn' ||
    account.status === 'migrating';

  return (
    <ModalShell onClose={onClose} size="lg" labelledBy="settings-title">
      <div className="px-6 pb-1 pt-[22px]">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-lime-ink">
          {t('settings.eyebrow')}
        </div>
        <h3 id="settings-title" className="mt-[5px] text-[22px] font-bold tracking-tight">
          {t('settings.title')}
        </h3>
      </div>

      <div className="grid gap-4 px-6 pb-2 pt-4">
        {/* Preferences */}
        <section className="grid gap-3">
          <div className="text-xs font-extrabold uppercase tracking-[0.04em] text-muted">
            {t('settings.preferences')}
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="set-lang" className={LABEL}>
              {t('lang.label')}
            </label>
            <select
              id="set-lang"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className={cn(CONTROL, 'cursor-pointer')}
            >
              <option value="en">{t('lang.en')}</option>
              <option value="id">{t('lang.id')}</option>
            </select>
            <p className="text-xs text-faint">{t('lang.note')}</p>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="set-currency" className={LABEL}>
              {t('settings.currency')}
            </label>
            <select
              id="set-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={cn(CONTROL, 'cursor-pointer')}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-faint">{t('settings.currencyNote')}</p>
          </div>
        </section>

        {/* Wedding details */}
        <section className="grid gap-3 border-t border-line pt-4">
          <div className="text-xs font-extrabold uppercase tracking-[0.04em] text-muted">
            {t('settings.weddingDetails')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextInput id="set-p1" label={t('settings.p1')} value={p1} onChange={setP1} />
            <TextInput id="set-p2" label={t('settings.p2')} value={p2} onChange={setP2} />
            <TextInput
              id="set-date"
              label={t('settings.date')}
              type="date"
              value={date}
              onChange={setDate}
            />
            <TextInput
              id="set-budget"
              label={t('settings.totalBudget')}
              type="number"
              value={budget}
              onChange={setBudget}
            />
          </div>
          <TextInput
            id="set-venue"
            label={t('settings.venue')}
            value={venue}
            onChange={setVenue}
            placeholder={t('settings.venuePh')}
          />
        </section>

        {/* Account & cloud sync */}
        {account.enabled && (
          <section className="grid gap-3 border-t border-line pt-4">
            <div className="text-xs font-extrabold uppercase tracking-[0.04em] text-muted">
              {t('account.section')}
            </div>
            <p className="text-xs text-faint">{t('account.note')}</p>

            {account.user ? (
              <>
                <div className="flex items-center gap-3 rounded-[12px] border border-line bg-panel/40 p-3">
                  {account.user.photoURL ? (
                    <img
                      src={account.user.photoURL}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-lime-soft text-sm font-extrabold text-lime-ink">
                      {(account.user.displayName || account.user.email || '?')[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-bold">
                      {account.user.displayName || account.user.email}
                    </div>
                    {account.user.displayName && (
                      <div className="truncate text-xs text-muted">{account.user.email}</div>
                    )}
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-lime-ink">
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          account.status === 'connected' ? 'bg-lime' : 'bg-warn',
                        )}
                      />
                      {t(
                        account.status === 'paused'
                          ? 'account.paused'
                          : account.status === 'migrating'
                            ? 'account.migrating'
                            : 'account.connected',
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {account.status === 'error' && (
                    <Button size="sm" icon="refresh" onClick={() => void account.retry(state)}>
                      {t('account.retry')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="dangerGhost"
                    icon="logout"
                    disabled={inRoom || accountBusy}
                    onClick={() => void account.signOut()}
                  >
                    {t('account.signOut')}
                  </Button>
                </div>
                {inRoom && <p className="text-xs text-faint">{t('account.leaveBeforeSignOut')}</p>}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[13px] font-semibold text-muted">
                  <span className="h-2 w-2 rounded-full bg-faint" />
                  {t('account.localOnly')}
                </div>
                <Button
                  size="sm"
                  variant="lime"
                  icon="login"
                  disabled={accountBusy}
                  onClick={() => void account.signIn(state)}
                  className="w-fit"
                >
                  {t(
                    account.status === 'signingIn'
                      ? 'account.signingIn'
                      : account.status === 'migrating'
                        ? 'account.migrating'
                        : 'account.signIn',
                  )}
                </Button>
              </>
            )}
            {account.error && (
              <p className="rounded-[10px] border border-bad/25 bg-bad-soft px-3 py-2 text-xs text-bad">
                {t(`account.error.${account.error}`)}
              </p>
            )}
          </section>
        )}

        {/* Your data */}
        <section className="grid gap-3 border-t border-line pt-4">
          <div className="text-xs font-extrabold uppercase tracking-[0.04em] text-muted">
            {t('settings.yourData')}
          </div>
          <p className="text-xs text-faint">
            {t(account.user ? 'settings.dataNoteCloud' : 'settings.dataNote')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" icon="download" onClick={exportData}>
              {t('settings.export')}
            </Button>
            <Button size="sm" icon="upload" onClick={() => fileRef.current?.click()}>
              {t('settings.import')}
            </Button>
            <Button size="sm" icon="auto_awesome" onClick={onSample}>
              {t('settings.sample')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="dangerGhost" icon="delete_forever" onClick={onClear}>
              {t('settings.clear')}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={onImportFile}
          />
          {account.enabled && (
            <div className="mt-1 grid gap-2 border-t border-line-2 pt-3">
              {/* Collapsed by default: safety backups are a break-glass tool, so
                  the list would otherwise crowd the everyday data buttons above. */}
              <button
                type="button"
                aria-expanded={backupsOpen}
                aria-controls="settings-backups"
                onClick={() => setBackupsOpen((open) => !open)}
                className="flex items-center gap-2 text-left text-xs font-bold text-muted transition-colors hover:text-ink"
              >
                <Icon
                  name="expand_more"
                  size={18}
                  className={cn('transition-transform', backupsOpen && 'rotate-180')}
                />
                <span className="flex-1">{t('account.backupTitle')}</span>
                {account.backups.length > 0 && (
                  <Chip variant="gray">{account.backups.length}</Chip>
                )}
              </button>
              {backupsOpen && (
                <div id="settings-backups" className="grid gap-2">
                  <p className="text-xs text-faint">{t('account.backupNote')}</p>
                  {account.backups.length ? (
                    <div className="grid gap-2">
                      {account.backups.map((backup) => (
                        <div
                          key={backup.key}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-line bg-panel/35 px-3 py-2"
                        >
                          <span className="text-xs font-semibold text-muted">
                            {t('account.backupDate', {
                              date: new Intl.DateTimeFormat(undefined, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              }).format(backup.createdAt),
                            })}
                          </span>
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              icon="restore"
                              onClick={() => onRestoreBackup(backup)}
                            >
                              {t('account.restore')}
                            </Button>
                            <Button
                              size="sm"
                              icon="download"
                              onClick={() => onDownloadBackup(backup)}
                            >
                              {t('account.download')}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-faint">{t('account.noBackups')}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Collaboration */}
        {room.enabled && (
          <section className="grid gap-3 border-t border-line pt-4">
            <div className="text-xs font-extrabold uppercase tracking-[0.04em] text-muted">
              {t('room.section')}
            </div>
            <p className="text-xs text-faint">{t('room.note')}</p>

            {inRoom ? (
              <>
                <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <span className="inline-block h-2 w-2 rounded-full bg-lime" />
                  {t('room.status.connected')}
                  <span className="text-faint">·</span>
                  <span className="text-muted">
                    {t('room.peers', { count: room.peers.length })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" icon="link" onClick={onCopyLink}>
                    {t('room.copyLink')}
                  </Button>
                  <Button
                    size="sm"
                    variant="dangerGhost"
                    icon="logout"
                    onClick={room.leave}
                  >
                    {t('room.leave')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="lime"
                    icon="group_add"
                    onClick={onCreateRoom}
                    disabled={room.status === 'connecting'}
                  >
                    {t('room.create')}
                  </Button>
                </div>
                <div className="flex items-end gap-2">
                  <div className="grid flex-1 gap-1.5">
                    <label htmlFor="room-join" className={LABEL}>
                      {t('room.join')}
                    </label>
                    <input
                      id="room-join"
                      value={joinInput}
                      onChange={(e) => setJoinInput(e.target.value)}
                      placeholder={t('room.joinPh')}
                      className={CONTROL}
                    />
                  </div>
                  <Button
                    size="sm"
                    icon="login"
                    onClick={onJoinRoom}
                    disabled={room.status === 'connecting' || !joinInput.trim()}
                  >
                    {t('room.join')}
                  </Button>
                </div>
                {room.status === 'connecting' && (
                  <p className="text-xs text-faint">{t('room.status.connecting')}</p>
                )}
                {room.error === 'notFound' && (
                  <p className="text-xs text-bad">{t('room.notFound')}</p>
                )}
                {room.error === 'generic' && (
                  <p className="text-xs text-bad">{t('room.status.error')}</p>
                )}
              </>
            )}
          </section>
        )}
      </div>

      <div className="flex justify-end gap-2.5 px-6 pb-[22px] pt-3.5">
        <Button variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={save}>
          {t('settings.saveChanges')}
        </Button>
      </div>
    </ModalShell>
  );
}

interface TextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}

function TextInput({ id, label, value, onChange, type = 'text', placeholder }: TextInputProps) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={type === 'number' ? 'decimal' : undefined}
        step={type === 'number' ? 'any' : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={CONTROL}
      />
    </div>
  );
}
