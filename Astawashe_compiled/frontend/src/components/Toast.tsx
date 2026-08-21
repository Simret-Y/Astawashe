import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

interface ToastProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const icons = {
  success: <CheckCircle size={18} className="text-emerald-500" />,
  error: <AlertTriangle size={18} className="text-red-500" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />,
  info: <Info size={18} className="text-blue-500" />,
};

const borders = {
  success: 'border-l-4 border-emerald-500',
  error: 'border-l-4 border-red-500',
  warning: 'border-l-4 border-amber-500',
  info: 'border-l-4 border-blue-500',
};

export const ToastContainer = ({ toasts, removeToast }: ToastProps) => (
  <div className="toast-container">
    <AnimatePresence>
      {toasts.map(toast => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          className={`flex items-center gap-3 bg-white rounded-xl shadow-lg px-4 py-3 min-w-72 max-w-sm ${borders[toast.type]}`}
        >
          {icons[toast.type]}
          <span className="text-sm font-medium text-gray-800 flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={14} />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

export const useToast = () => {
  const show = (type: ToastType, message: string) => {
    const event = new CustomEvent('show-toast', { detail: { type, message } });
    window.dispatchEvent(event);
  };
  return {
    success: (msg: string) => show('success', msg),
    error: (msg: string) => show('error', msg),
    warning: (msg: string) => show('warning', msg),
    info: (msg: string) => show('info', msg),
  };
};
