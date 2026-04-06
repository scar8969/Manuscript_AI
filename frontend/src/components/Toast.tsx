import { create } from 'zustand';

export type ToastType = 'error' | 'success' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

let toastId = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'error') => {
    const id = `toast-${++toastId}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}));

export function toast(message: string, type: ToastType = 'error') {
  useToastStore.getState().addToast(message, type);
}

const iconMap = {
  error: 'error',
  success: 'check_circle',
  info: 'info',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-12 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-sm px-4 py-3 text-sm font-medium flex items-center gap-3 cursor-pointer transition-all duration-300 animate-slide-in-right ${
            t.type === 'error'
              ? 'bg-error-container text-error'
              : t.type === 'success'
              ? 'bg-surface-container-lowest text-on-surface'
              : 'bg-surface-container-lowest text-on-surface shadow-md'
          }`}
          style={{ boxShadow: '0px 12px 32px rgba(25, 28, 30, 0.06)' }}
          onClick={() => removeToast(t.id)}
          role="alert"
        >
          <span className="material-symbols-outlined text-lg flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
            {iconMap[t.type]}
          </span>
          <span className="flex-1 leading-snug">{t.message}</span>
          <span className="material-symbols-outlined text-xs opacity-40 hover:opacity-70 transition-opacity flex-shrink-0">close</span>
        </div>
      ))}
    </div>
  );
}
