import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Icon } from './Icon';
import { cn } from '@presentation/lib/cn';

export interface ToastOptions {
  icon?: string;
  action?: string;
  onAction?: () => void;
}

type ToastFn = (msg: string, opts?: ToastOptions) => void;

const ToastContext = createContext<ToastFn | null>(null);

interface ToastData {
  msg: string;
  icon: string;
  action?: string;
  onAction?: () => void;
  show: boolean;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ToastData>({
    msg: '',
    icon: 'check_circle',
    show: false,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const toast = useCallback<ToastFn>((msg, opts = {}) => {
    if (timer.current) clearTimeout(timer.current);
    setData({
      msg,
      icon: opts.icon || 'check_circle',
      action: opts.action,
      onAction: opts.onAction,
      show: true,
    });
    timer.current = setTimeout(
      () => setData((d) => ({ ...d, show: false })),
      opts.action ? 5000 : 2400,
    );
  }, []);

  const runAction = () => {
    if (timer.current) clearTimeout(timer.current);
    setData((d) => ({ ...d, show: false }));
    data.onAction?.();
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          'fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300',
          data.show
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-5 opacity-0',
        )}
      >
        <Icon name={data.icon} size={18} className="text-lime" />
        <span>{data.msg}</span>
        {data.action && (
          <button
            type="button"
            onClick={runAction}
            className="ml-1.5 rounded-[9px] bg-lime px-3 py-1.5 text-[13px] font-bold text-ink transition-colors hover:bg-lime-2"
          >
            {data.action}
          </button>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
