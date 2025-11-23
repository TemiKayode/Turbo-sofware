/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_STRIPE_PRICE_BASIC_MONTHLY: string
  readonly VITE_STRIPE_PRICE_BASIC_YEARLY: string
  readonly VITE_STRIPE_PRICE_PRO_MONTHLY: string
  readonly VITE_STRIPE_PRICE_PRO_YEARLY: string
  readonly VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY: string
  readonly VITE_STRIPE_PRICE_ENTERPRISE_YEARLY: string
  readonly VITE_ENCRYPTION_KEY: string
  readonly VITE_FINGERPRINTJS_API_KEY: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_SENTRY_DEBUG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

