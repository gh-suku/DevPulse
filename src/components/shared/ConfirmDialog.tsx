// Custom confirmation dialog component
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6"
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                variant === 'danger' && "bg-rose-100 text-rose-600",
                variant === 'warning' && "bg-amber-100 text-amber-600",
                variant === 'info' && "bg-blue-100 text-blue-600"
              )}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 break-words">
                  {message}
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                  variant === 'danger' && "bg-rose-500 text-white hover:bg-rose-600",
                  variant === 'warning' && "bg-amber-500 text-white hover:bg-amber-600",
                  variant === 'info' && "bg-blue-500 text-white hover:bg-blue-600"
                )}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
