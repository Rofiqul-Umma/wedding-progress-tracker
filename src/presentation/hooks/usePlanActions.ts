import { useTranslation } from 'react-i18next';
import { usePlan } from '@presentation/state/PlanStore';
import { useToast } from '@presentation/hooks/useToast';
import { toggleTaskDone, deleteTask, insertTask } from '@application/use-cases/tasks';
import {
  toggleBudgetPaid,
  deleteBudgetItem,
  insertBudgetItem,
} from '@application/use-cases/budget';
import {
  cycleSeserahanStatus,
  deleteSeserahan,
  insertSeserahan,
  toggleSeserahanContent,
} from '@application/use-cases/seserahan';
import {
  cycleShoppingStatus,
  deleteShopping,
  insertShopping,
} from '@application/use-cases/shopping';
import { deleteVendor, insertVendor } from '@application/use-cases/vendors';
import { deleteContact, insertContact } from '@application/use-cases/contacts';
import { nextSeserahanStatus, nextShoppingStatus } from '@domain/value-objects/status';
import { seed } from '@infrastructure/persistence/seed';
import { migrate } from '@infrastructure/persistence/migrate';
import { clearData, serializePlan } from '@application/use-cases/data';
import { isValidImport } from '@application/dto/importValidation';

/**
 * Imperative plan mutations that pair a pure use case with a toast (and, for
 * deletes, an Undo action). The Settings modal wires save/import here too.
 */
export function usePlanActions() {
  const { state, setState } = usePlan();
  const toast = useToast();
  const { t } = useTranslation();

  function toggleTask(id: string) {
    const task = state.tasks.find((x) => x.id === id);
    setState((s) => toggleTaskDone(s, id));
    toast(task && !task.done ? t('toast.taskComplete') : t('toast.taskTodo'));
  }

  function togglePaid(id: string) {
    const item = state.budget.find((x) => x.id === id);
    setState((s) => toggleBudgetPaid(s, id));
    toast(item && !item.paid ? t('toast.paid') : t('toast.unpaid'));
  }

  function cycleSeserahan(id: string) {
    const item = state.seserahan.find((x) => x.id === id);
    // A bundle takes its status from its checklist; there is nothing to cycle.
    if (item?.contents.length) return;
    setState((s) => cycleSeserahanStatus(s, id));
    if (item) {
      const next = nextSeserahanStatus(item.status);
      toast(t('seserahan.advanced', { name: item.name, status: t(`status.ses.${next}`) }));
    }
  }

  // No toast: ticking is high-frequency and the checkbox is its own feedback.
  function toggleSeserahanContentAction(itemId: string, contentId: string) {
    setState((s) => toggleSeserahanContent(s, itemId, contentId));
  }

  function cycleShopping(id: string) {
    const item = state.shopping.find((x) => x.id === id);
    setState((s) => cycleShoppingStatus(s, id));
    if (item) {
      const next = nextShoppingStatus(item.status);
      toast(t('shopping.advanced', { name: item.name, status: t(`status.shop.${next}`) }));
    }
  }

  function deleteShoppingAction(id: string) {
    const r = deleteShopping(state, id);
    if (!r.removed) return;
    const removed = r.removed;
    setState(r.state);
    toast(t('toast.removed', { label: t('entity.shopping') }), {
      icon: 'delete',
      action: t('toast.undo'),
      onAction: () => {
        setState((s) => insertShopping(s, removed, r.index));
        toast(t('toast.restoredItem', { label: t('entity.shopping') }));
      },
    });
  }

  function deleteVendorAction(id: string) {
    const r = deleteVendor(state, id);
    if (!r.removed) return;
    const removed = r.removed;
    setState(r.state);
    toast(t('toast.removed', { label: t('entity.vendor') }), {
      icon: 'delete',
      action: t('toast.undo'),
      onAction: () => {
        setState((s) => insertVendor(s, removed, r.index));
        toast(t('toast.restoredItem', { label: t('entity.vendor') }));
      },
    });
  }

  function deleteBudgetAction(id: string) {
    const r = deleteBudgetItem(state, id);
    if (!r.removed) return;
    const removed = r.removed;
    setState(r.state);
    toast(t('toast.removed', { label: t('entity.expense') }), {
      icon: 'delete',
      action: t('toast.undo'),
      onAction: () => {
        setState((s) => insertBudgetItem(s, removed, r.index));
        toast(t('toast.restoredItem', { label: t('entity.expense') }));
      },
    });
  }

  function deleteTaskAction(id: string) {
    const r = deleteTask(state, id);
    if (!r.removed) return;
    const removed = r.removed;
    setState(r.state);
    toast(t('toast.removed', { label: t('entity.task') }), {
      icon: 'delete',
      action: t('toast.undo'),
      onAction: () => {
        setState((s) => insertTask(s, removed, r.index));
        toast(t('toast.restoredItem', { label: t('entity.task') }));
      },
    });
  }

  function deleteSeserahanAction(id: string) {
    const r = deleteSeserahan(state, id);
    if (!r.removed) return;
    const removed = r.removed;
    setState(r.state);
    toast(t('toast.removed', { label: t('entity.seserahan') }), {
      icon: 'delete',
      action: t('toast.undo'),
      onAction: () => {
        setState((s) => insertSeserahan(s, removed, r.index));
        toast(t('toast.restoredItem', { label: t('entity.seserahan') }));
      },
    });
  }

  function deleteContactAction(id: string) {
    const r = deleteContact(state, id);
    if (!r.removed) return;
    const removed = r.removed;
    setState(r.state);
    toast(t('toast.removed', { label: t('entity.contact') }), {
      icon: 'delete',
      action: t('toast.undo'),
      onAction: () => {
        setState((s) => insertContact(s, removed, r.index));
        toast(t('toast.restoredItem', { label: t('entity.contact') }));
      },
    });
  }

  function loadSample() {
    setState(seed());
    toast(t('toast.sampleLoaded'));
  }

  function clearAll() {
    setState((s) => clearData(s));
    toast(t('toast.cleared'));
  }

  function exportData() {
    try {
      const blob = new Blob([serializePlan(state)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = `${state.wedding.p1 || 'wedding'}-${state.wedding.p2 || 'plan'}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      a.href = url;
      a.download = `evermore-${name}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast(t('toast.exported'));
    } catch {
      toast(t('toast.exportFail'));
    }
  }

  function importData(file: File, onDone?: () => void) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data: unknown = JSON.parse(String(reader.result));
        if (!isValidImport(data)) throw new Error('bad');
        setState(migrate(data));
        toast(t('toast.restored'));
        onDone?.();
      } catch {
        toast(t('toast.importFail'));
      }
    };
    reader.readAsText(file);
  }

  return {
    toggleTask,
    togglePaid,
    cycleSeserahan,
    toggleSeserahanContent: toggleSeserahanContentAction,
    cycleShopping,
    deleteVendor: deleteVendorAction,
    deleteBudget: deleteBudgetAction,
    deleteTask: deleteTaskAction,
    deleteSeserahan: deleteSeserahanAction,
    deleteShopping: deleteShoppingAction,
    deleteContact: deleteContactAction,
    loadSample,
    clearAll,
    exportData,
    importData,
  };
}
