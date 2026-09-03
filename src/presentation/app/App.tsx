import { Providers } from './providers';
import { Sidebar } from '@presentation/components/layout/Sidebar';
import { Topbar } from '@presentation/components/layout/Topbar';
import { MobileDrawer } from '@presentation/components/layout/MobileDrawer';
import { TaskDetail } from '@presentation/components/dashboard/TaskDetail';
import { Modal } from '@presentation/components/ui/Modal';
import { PreviewModal } from '@presentation/components/ui/PreviewModal';
import { ImageViewer } from '@presentation/components/ui/ImageViewer';
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
              className="fade-in min-w-0 flex-1 overflow-auto pt-6 pl-[calc(1.625rem+var(--sa-left))] pr-[calc(1.625rem+var(--sa-right))] pb-[calc(2.5rem+var(--sa-bottom))] max-[860px]:pt-[18px] max-[860px]:pl-[calc(1rem+var(--sa-left))] max-[860px]:pr-[calc(1rem+var(--sa-right))]"
            >
              <Page />
            </section>
            {page === 'dashboard' && (
              <aside className="w-[306px] flex-none overflow-auto border-l border-line px-[22px] pt-6 pr-[calc(1.375rem+var(--sa-right))] pb-[calc(2rem+var(--sa-bottom))] max-[1040px]:hidden">
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
      <ImageViewer />
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
