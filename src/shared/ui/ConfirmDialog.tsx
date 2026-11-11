import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'warning',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-4">
        <div
          className={`rounded-full p-2 flex-shrink-0 ${
            variant === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'
          }`}
        >
          <AlertTriangle
            className={`h-5 w-5 ${
              variant === 'danger' ? 'text-red-500' : 'text-amber-500'
            }`}
          />
        </div>
        <p className="text-sm text-text-muted flex-1">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-secondary transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors cursor-pointer ${
            variant === 'danger'
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-accent hover:bg-accent-hover'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
