/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';

/** Toast notification type */
export type ToastType = 'success' | 'info' | 'warning' | 'error';

/** Toast notification interface */
export interface Toast {
  type: ToastType;
  message: string;
  id: number;
}

/**
 * Custom hook for managing toast notifications.
 * Auto-dismisses after specified duration (default 3 seconds).
 * 
 * @returns Object containing toasts array and notification functions
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration: number = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { type, message, id }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    addToast('success', message, duration);
  }, [addToast]);

  const info = useCallback((message: string, duration?: number) => {
    addToast('info', message, duration);
  }, [addToast]);

  const warning = useCallback((message: string, duration?: number) => {
    addToast('warning', message, duration);
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    addToast('error', message, duration);
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    info,
    warning,
    error,
    clearAll
  };
}
