import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const config = {
  success: { icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', iconColor: 'text-emerald-500' },
  error: { icon: XCircle, bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', iconColor: 'text-rose-500' },
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconColor: 'text-blue-500' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconColor: 'text-amber-500' },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const c = config[toast.type];
  const Icon = c.icon;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border ${c.bg} ${c.border} px-4 py-3 shadow-lg animate-fadeIn min-w-[280px] max-w-md`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${c.iconColor}`} />
      <p className={`flex-1 text-sm font-medium ${c.text}`}>{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className={`shrink-0 rounded-lg p-1 ${c.text} opacity-50 hover:opacity-100`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
