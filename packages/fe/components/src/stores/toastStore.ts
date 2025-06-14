import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface ToastState {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  active: boolean;
  persistent: boolean;
}

interface ToastStore {
  toast: ToastState;
  showToast: (message: string, type: ToastState['type'], persistent?: boolean) => void;
  hideToast: () => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const initialToastState: ToastState = {
  message: '',
  type: 'info',
  active: false,
  persistent: false,
};

export const useToastStore = create<ToastStore>()(
  subscribeWithSelector((set, get) => ({
    toast: initialToastState,

    showToast: (message, type, persistent = false) => {
      set({
        toast: {
          message,
          type,
          active: true,
          persistent,
        },
      });
    },

    hideToast: () => {
      set({
        toast: { ...get().toast, active: false },
      });
    },

    showError: (message) => get().showToast(message, 'error', true),
    showSuccess: (message) => get().showToast(message, 'success'),
    showInfo: (message) => get().showToast(message, 'info'),
    showWarning: (message) => get().showToast(message, 'warning'),
  }))
);
