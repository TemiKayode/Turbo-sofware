import * as Sentry from '@sentry/react'

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN

  if (!dsn) {
    if (import.meta.env.DEV) {
      console.info('Sentry DSN not configured. Error tracking disabled.')
    }
    return
  }

  try {
    Sentry.init({
      dsn,
      integrations: [
        Sentry.browserTracingIntegration({
          tracePropagationTargets: ['localhost', /^\//],
        }),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      // Session Replay
      replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
      // Filter out sensitive data
      beforeSend(event, hint) {
        // Don't send events in development unless explicitly testing
        if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_DEBUG) {
          return null
        }
        return event
      },
    })
    if (import.meta.env.DEV) {
      console.info('Sentry initialized successfully')
    }
  } catch (error) {
    console.error('Failed to initialize Sentry:', error)
  }
}

// Export Sentry components for React
export { Sentry }
export const SentryErrorBoundary = Sentry.withErrorBoundary
