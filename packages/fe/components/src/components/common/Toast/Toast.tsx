import React, { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '../../../stores/toastStore';
import styles from './Toast.module.scss';

const iconMap = {
  info: <Info size={20} aria-hidden="true" />,
  success: <CheckCircle2 size={20} aria-hidden="true" />,
  warning: <AlertCircle size={20} aria-hidden="true" />,
  error: <XCircle size={20} aria-hidden="true" />,
};

const ERROR_TIMEOUT = 7500;
const MESSAGE_TIMEOUT = 3000;

/**
 * Simplified Toast component with proper accessibility
 * Uses Zustand for state management instead of complex context
 */
const ToastSimple: React.FC = () => {
  const { toast, hideToast } = useToastStore();
  const timeoutRef = useRef<number | null>(null);

  // Auto-hide functionality with proper cleanup
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (toast.active && !toast.persistent) {
      const delay = toast.type === 'error' ? ERROR_TIMEOUT : MESSAGE_TIMEOUT;

      timeoutRef.current = window.setTimeout(() => {
        hideToast();
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [toast.active, toast.type, toast.persistent, hideToast]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && toast.active) {
        hideToast();
      }
    };

    if (toast.active) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toast.active, hideToast]);

  const handleClose = () => {
    hideToast();
  };

  return (
    <AnimatePresence mode="wait">
      {toast.active && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`${styles.toast} ${styles[toast.type]}`}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          aria-labelledby="toast-message"
          aria-describedby="toast-close"
        >
          <div className={styles.content}>
            <div className={styles.icon}>{iconMap[toast.type as keyof typeof iconMap]}</div>
            <div id="toast-message" className={styles.message}>
              {toast.message}
            </div>
          </div>

          <button
            id="toast-close"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label={`Close ${toast.type} notification`}
            type="button"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastSimple;
