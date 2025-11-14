import * as React from 'react'
import * as Toast from '@radix-ui/react-toast'

interface ToastContextType {
  toast: (message: string, variant?: 'default' | 'success' | 'error') => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function Toaster() {
  const [toasts, setToasts] = React.useState<Array<{ id: string; message: string; variant: 'default' | 'success' | 'error' }>>([])

  const toast = React.useCallback((message: string, variant: 'default' | 'success' | 'error' = 'default') => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, message, variant }])
  }, [])

  React.useEffect(() => {
    const contextValue = { toast }
    // Store in window for global access
    ;(window as any).__toastContext = contextValue
  }, [toast])

  return (
    <Toast.Provider swipeDirection="right">
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          className="bg-white border rounded-lg shadow-lg p-4 data-[state=open]:animate-slideIn data-[state=closed]:animate-hide"
          onOpenChange={(open) => {
            if (!open) {
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
          }}
        >
          <Toast.Title className="font-semibold">{toast.message}</Toast.Title>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-[var(--viewport-padding)] gap-[10px] [--viewport-padding:_25px] sm:flex-col md:max-w-[420px]" />
    </Toast.Provider>
  )
}

export function useToast() {
  const toast = React.useCallback((message: string, variant: 'default' | 'success' | 'error' = 'default') => {
    const context = (window as any).__toastContext
    if (context) {
      context.toast(message, variant)
    } else {
      console.log(`[Toast ${variant}]:`, message)
    }
  }, [])

  return { toast }
}


