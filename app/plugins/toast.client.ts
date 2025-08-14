export default defineNuxtPlugin(() => {
  // Initialize toast system on client
  return {
    provide: {
      toast: {
        success: (message: string, title?: string, duration?: number) => {
          if (typeof window !== 'undefined' && window.$toast) {
            window.$toast.success(message, title, duration)
          }
        },
        error: (message: string, title?: string, duration?: number) => {
          if (typeof window !== 'undefined' && window.$toast) {
            window.$toast.error(message, title, duration)
          }
        },
        warning: (message: string, title?: string, duration?: number) => {
          if (typeof window !== 'undefined' && window.$toast) {
            window.$toast.warning(message, title, duration)
          }
        },
        info: (message: string, title?: string, duration?: number) => {
          if (typeof window !== 'undefined' && window.$toast) {
            window.$toast.info(message, title, duration)
          }
        }
      }
    }
  }
})