import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'teal' | 'rose';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'teal',
  onConfirm,
  onCancel,
  isLoading = false,
  children,
}) => {
  if (!isOpen) return null;

  const confirmBtnClasses =
    confirmVariant === 'rose'
      ? 'bg-rose-600 hover:bg-rose-500 text-white'
      : 'bg-[#0F766E] hover:bg-[#0D655E] text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#14243A]/60 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="my-auto max-h-[calc(100dvh-1rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
        <div>
          <h3 className="text-base font-bold text-[#14243A]">{title}</h3>
          {description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>}
        </div>

        {children}

        <div className="flex flex-col-reverse items-stretch justify-end gap-2 border-t border-slate-100 pt-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="min-h-10 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition disabled:opacity-50 ${confirmBtnClasses}`}
          >
            {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
