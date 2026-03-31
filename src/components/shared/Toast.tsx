// Toast notification component
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 3000
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info
  };

  const Icon = icons[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border",
            type === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-800",
            type === 'error' && "bg-rose-50 border-rose-200 text-rose-800",
            type === 'info' && "bg-blue-50 border-blue-200 text-blue-800"
          )}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium flex-1 break-words">{message}</p>
            <button
              onClick={onClose}
              className="p-1 hover:bg-black/5 rounded transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for managing toast state
export const useToast = () => {
  const [toast, setToast] = React.useState<{
    message: string;
    type: ToastType;
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  return { toast, showToast, hideToast };
};
