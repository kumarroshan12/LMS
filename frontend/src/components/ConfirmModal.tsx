import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-[#14243A]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#14243A]">{title}</h3>
          {description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>}
        </div>

        {children}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 ${confirmBtnClasses}`}
          >
            {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
