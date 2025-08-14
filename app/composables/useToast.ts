export interface ToastOptions {
  title?: string
  duration?: number
}

export function useToast() {
  const success = (message: string, options?: ToastOptions) => {
    if (process.client && window.$toast) {
      window.$toast.success(message, options?.title, options?.duration)
    }
  }

  const error = (message: string, options?: ToastOptions) => {
    if (process.client && window.$toast) {
      window.$toast.error(message, options?.title, options?.duration)
    }
  }

  const warning = (message: string, options?: ToastOptions) => {
    if (process.client && window.$toast) {
      window.$toast.warning(message, options?.title, options?.duration)
    }
  }

  const info = (message: string, options?: ToastOptions) => {
    if (process.client && window.$toast) {
      window.$toast.info(message, options?.title, options?.duration)
    }
  }

  return {
    success,
    error,
    warning,
    info
  }
}

// Types for global window object
declare global {
  interface Window {
    $toast: {
      success: (message: string, title?: string, duration?: number) => void
      error: (message: string, title?: string, duration?: number) => void
      warning: (message: string, title?: string, duration?: number) => void
      info: (message: string, title?: string, duration?: number) => void
    }
  }
}