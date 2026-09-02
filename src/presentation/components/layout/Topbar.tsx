import { useTranslation } from 'react-i18next';
import { Icon } from '@presentation/components/ui/Icon';
import { Button } from '@presentation/components/ui/Button';
import { IconButton } from '@presentation/components/ui/IconButton';
import { NotificationsPanel } from '@presentation/components/NotificationsPanel';
import { RoomPresence } from '@presentation/components/RoomPresence';
import { usePlan } from '@presentation/state/PlanStore';
import { useRoom } from '@presentation/state/RoomStore';
import { useNav } from '@presentation/state/NavStore';
import { useUi } from '@presentation/state/UiStore';
import { useToast } from '@presentation/components/ui/Toast';
import { useFormat } from '@presentation/hooks/useFormat';
import { useOpenAdd } from '@presentation/hooks/useOpenAdd';
import { openTasks, sesDone, shopBought } from '@domain/services/progress';
import { vendorsTotal } from '@domain/services/budget';

function greetingKey(): 'morning' | 'afternoon' | 'evening' {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

export function Topbar() {
  const { t } = useTranslation();
  const { state } = usePlan();
  const { enabled, status, copyLink } = useRoom();
  const { page, search, setSearch } = useNav();
  const { openNav } = useUi();
  const { money } = useFormat();
  const openAdd = useOpenAdd();
  const toast = useToast();

  const inRoom = enabled && status === 'connected';
  const share = async () => {
    const ok = await copyLink();
    if (ok) toast(t('room.linkCopied'), { icon: 'link' });
  };

  let title: string;
  let sub: string;
  let addLabel: string;

  switch (page) {
    case 'vendors':
      title = t('topbar.vendorsTitle');
      sub = t('topbar.vendorsSub', {
        count: state.vendors.length,
        committed: money(vendorsTotal(state.vendors)),
      });
      addLabel = t('topbar.addVendor');
      break;
    case 'budget':
      title = t('topbar.budgetTitle');
      sub = t('topbar.budgetSub');
      addLabel = t('topbar.addExpense');
      break;
    case 'tasks':
      title = t('topbar.tasksTitle');
      sub = t('topbar.tasksSub', {
        open: openTasks(state.tasks),
        total: state.tasks.length,
      });
      addLabel = t('topbar.addTask');
      break;
    case 'shopping':
      title = t('topbar.shoppingTitle');
      sub = t('topbar.shoppingSub', {
        bought: shopBought(state.shopping),
        total: state.shopping.length,
      });
      addLabel = t('topbar.addShopping');
      break;
    case 'seserahan':
      title = t('topbar.seserahanTitle');
      sub = t('topbar.seserahanSub', {
        done: sesDone(state.seserahan),
        total: state.seserahan.length,
      });
      addLabel = t('topbar.addItem');
      break;
    case 'contacts':
      title = t('topbar.contactsTitle');
      sub = t('topbar.contactsSub', { count: state.contacts.length });
      addLabel = t('topbar.addContact');
      break;
    case 'reports':
      title = t('topbar.reportsTitle');
      sub = t('topbar.reportsSub');
      addLabel = '';
      break;
    case 'dashboard':
    default:
      title = t('topbar.dashboardTitle');
      sub = t('topbar.dashboardSub', {
        greeting: t(`greeting.${greetingKey()}`),
        p1: state.wedding.p1,
        p2: state.wedding.p2,
      });
      addLabel = t('topbar.addTask');
      break;
  }

  return (
    <header className="flex flex-none items-center gap-4 border-b border-line px-[26px] py-[22px] pl-[calc(1.625rem+env(safe-area-inset-left))] pr-[calc(1.625rem+env(safe-area-inset-right))] max-[860px]:gap-2.5 max-[860px]:p-4 max-[860px]:pl-[calc(1rem+env(safe-area-inset-left))] max-[860px]:pr-[calc(1rem+env(safe-area-inset-right))] print:hidden">
      <IconButton
        icon="menu"
        label={t('nav.menu')}
        onClick={openNav}
        className="hidden h-10 w-10 max-[860px]:grid"
      />
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight max-[520px]:text-xl">{title}</h1>
        <p className="mt-[3px] truncate text-[13px] text-muted max-[460px]:hidden">
          {sub}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <label className="flex w-[220px] items-center gap-2 rounded-xl border border-transparent bg-panel px-[13px] py-[9px] transition-colors focus-within:border-ink focus-within:bg-white max-[860px]:w-[150px] max-[460px]:hidden">
          <Icon name="search" size={19} className="text-faint" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            aria-label={t('common.searchAria')}
            className="w-full border-0 bg-transparent text-[13.5px] outline-none"
          />
        </label>
        {inRoom && <RoomPresence />}
        {inRoom && (
          <Button
            variant="ghost"
            icon="link"
            onClick={share}
            className="max-[860px]:hidden"
          >
            {t('room.share')}
          </Button>
        )}
        <NotificationsPanel />
        {page !== 'reports' && (
          <Button variant="primary" icon="add" onClick={openAdd} aria-label={addLabel}>
            <span className="max-[520px]:hidden">{addLabel}</span>
          </Button>
        )}
      </div>
    </header>
  );
}
