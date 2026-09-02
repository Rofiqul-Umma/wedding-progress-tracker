import { Providers } from './providers';
import { Sidebar } from '@presentation/components/layout/Sidebar';
import { Topbar } from '@presentation/components/layout/Topbar';
import { MobileDrawer } from '@presentation/components/layout/MobileDrawer';
import { TaskDetail } from '@presentation/components/dashboard/TaskDetail';
import { Modal } from '@presentation/components/ui/Modal';
import { PreviewModal } from '@presentation/components/ui/PreviewModal';
import { SettingsModal } from '@presentation/components/SettingsModal';
import { DashboardPage } from '@presentation/pages/DashboardPage';
import { VendorsPage } from '@presentation/pages/VendorsPage';
import { BudgetPage } from '@presentation/pages/BudgetPage';
import { TasksPage } from '@presentation/pages/TasksPage';
import { ShoppingPage } from '@presentation/pages/ShoppingPage';
import { SeserahanPage } from '@presentation/pages/SeserahanPage';
import { ContactsPage } from '@presentation/pages/ContactsPage';
import { ReportsPage } from '@presentation/pages/ReportsPage';
import { usePlan } from '@presentation/state/PlanStore';
import { useNav } from '@presentation/state/NavStore';
import { useUi } from '@presentation/state/UiStore';
import { useForms } from '@presentation/hooks/useForms';

const PAGE_COMPONENTS = {
  dashboard: DashboardPage,
  vendors: VendorsPage,
  budget: BudgetPage,
  tasks: TasksPage,
  shopping: ShoppingPage,
  seserahan: SeserahanPage,
  contacts: ContactsPage,
  reports: ReportsPage,
} as const;

function Shell() {
  const { state } = usePlan();
  const { page, selectedTaskId } = useNav();
  const { form, closeForm, settingsOpen, closeSettings, openForm } = useUi();
  const { taskForm } = useForms();

  const Page = PAGE_COMPONENTS[page];
  const selectedTask =
    state.tasks.find((task) => task.id === selectedTaskId) ?? state.tasks[0];

  return (
    <>
      <div id="app-shell" className="flex h-[100dvh] overflow-hidden">
        <Sidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <div className="flex min-h-0 flex-1">
            <section
              key={page}
              className="fade-in min-w-0 flex-1 overflow-auto px-[26px] pt-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] max-[860px]:px-4 max-[860px]:pt-[18px]"
            >
              <Page />
            </section>
            {page === 'dashboard' && (
              <aside className="w-[306px] flex-none overflow-auto border-l border-line px-[22px] pb-8 pt-6 max-[1040px]:hidden">
                <TaskDetail task={selectedTask} onEdit={(task) => openForm(taskForm(task))} />
              </aside>
            )}
          </div>
        </main>
      </div>

      <MobileDrawer />

      {form && <Modal form={form} onClose={closeForm} />}
      <PreviewModal />
      {settingsOpen && <SettingsModal onClose={closeSettings} />}
    </>
  );
}

export function App() {
  return (
    <Providers>
      <Shell />
    </Providers>
  );
}
