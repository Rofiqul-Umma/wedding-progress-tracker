import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalShell } from '@presentation/components/ui/ModalShell';
import { Button } from '@presentation/components/ui/Button';
import { CONTROL, LABEL } from '@presentation/components/forms/FormField';
import { usePlan } from '@presentation/state/PlanStore';
import { useRoom } from '@presentation/state/RoomStore';
import { useNav } from '@presentation/state/NavStore';
import { useToast } from '@presentation/hooks/useToast';
import { usePlanActions } from '@presentation/hooks/usePlanActions';
import { saveSettings } from '@application/use-cases/settings';
import { CURRENCIES } from '@infrastructure/format/money';
import type { Lang } from '@domain/entities/types';
import { cn } from '@presentation/lib/cn';

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { state, setState } = usePlan();
  const room = useRoom();
  const { go } = useNav();
  const toast = useToast();
  const { exportData, importData, loadSample, clearAll } = usePlanActions();
  const fileRef = useRef<HTMLInputElement>(null);

  const [joinInput, setJoinInput] = useState('');
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
    void room.createRoom(state);
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
    void room.join(id);
    setJoinInput('');
  }

  async function onCopyLink() {
    if (await room.copyLink()) toast(t('room.linkCopied'));
  }

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

        {/* Your data */}
        <section className="grid gap-3 border-t border-line pt-4">
          <div className="text-xs font-extrabold uppercase tracking-[0.04em] text-muted">
            {t('settings.yourData')}
          </div>
          <p className="text-xs text-faint">{t('settings.dataNote')}</p>
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
