import { useCallback } from 'react'
import { useToast } from '@/components/ui/toaster'

interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  fallbackMessage?: string
}

export function useErrorHandler() {
  const { toast } = useToast()

  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const {
        showToast = true,
        logError = true,
        fallbackMessage = 'An unexpected error occurred. Please try again.',
      } = options

      let errorMessage = fallbackMessage

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message)
      }

      if (logError) {
        console.error('Error:', error)
      }

      if (showToast) {
        toast(errorMessage, 'error')
      }

      return errorMessage
    },
    [toast]
  )

  return { handleError }
}

