import type { ReactNode } from 'react';

type AlertType = 'error' | 'success' | 'warning' | 'info';

interface AlertProps {
  type?: AlertType;
  children: ReactNode;
  onClose?: () => void;
}

const styles: Record<AlertType, string> = {
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-300',
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-300',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-300',
};

const icons: Record<AlertType, string> = {
  error: '❌',
  success: '✅',
  warning: '⚠️',
  info: 'ℹ️',
};

export function Alert({ type = 'info', children, onClose }: AlertProps) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${styles[type]}`} role="alert">
      <span className="mt-0.5 shrink-0">{icons[type]}</span>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  );
}
