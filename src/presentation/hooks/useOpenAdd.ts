import { useForms } from './useForms';
import { useUi } from '@presentation/state/UiStore';
import { useNav } from '@presentation/state/NavStore';

/** Opens the "add" form appropriate to the current page. */
export function useOpenAdd(): () => void {
  const { page } = useNav();
  const { openForm } = useUi();
  const forms = useForms();

  return () => {
    switch (page) {
      case 'vendors':
        return openForm(forms.vendorForm());
      case 'budget':
        return openForm(forms.budgetForm());
      case 'shopping':
        return openForm(forms.shoppingForm());
      case 'seserahan':
        return openForm(forms.seserahanForm());
      case 'contacts':
        return openForm(forms.contactForm());
      case 'dashboard':
      case 'tasks':
      default:
        return openForm(forms.taskForm());
    }
  };
}
