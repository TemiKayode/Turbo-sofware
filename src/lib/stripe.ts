import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

export const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null

export interface PricingTier {
  id: string
  name: string
  price: number
  maxUsers: number
  maxCompanies: number
  maxDocuments: number
  features: string[]
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    maxUsers: 1,
    maxCompanies: 1,
    maxDocuments: 10,
    features: ['Basic features', '1 user', '1 company', '10 documents'],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    maxUsers: 5,
    maxCompanies: 3,
    maxDocuments: 100,
    features: ['All free features', '5 users', '3 companies', '100 documents', 'Email support'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    maxUsers: 25,
    maxCompanies: 10,
    maxDocuments: 1000,
    features: ['All basic features', '25 users', '10 companies', '1000 documents', 'Priority support', 'Advanced security'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    maxUsers: 100,
    maxCompanies: 50,
    maxDocuments: 10000,
    features: ['All professional features', '100 users', '50 companies', '10,000 documents', '24/7 support', 'Custom integrations', 'Dedicated account manager'],
  },
]

/**
 * Calculate subscription price based on tier and billing cycle
 */
export function calculatePrice(tierId: string, billingCycle: 'monthly' | 'yearly' = 'monthly'): number {
  const tier = PRICING_TIERS.find(t => t.id === tierId)
  if (!tier) return 0
  
  if (billingCycle === 'yearly') {
    return Math.round(tier.price * 12 * 0.8) // 20% discount for yearly
  }
  return tier.price
}

/**
 * Get Stripe price ID from tier and billing cycle
 * This should match your Stripe dashboard configuration
 */
export function getStripePriceId(tierId: string, billingCycle: 'monthly' | 'yearly'): string {
  // These should be replaced with actual Stripe Price IDs from your Stripe dashboard
  const priceIds: Record<string, { monthly: string; yearly: string }> = {
    free: { monthly: '', yearly: '' },
    basic: { 
      monthly: import.meta.env.VITE_STRIPE_PRICE_BASIC_MONTHLY || '',
      yearly: import.meta.env.VITE_STRIPE_PRICE_BASIC_YEARLY || '',
    },
    professional: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || '',
      yearly: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY || '',
    },
    enterprise: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
      yearly: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE_YEARLY || '',
    },
  }
  
  return priceIds[tierId]?.[billingCycle] || ''
}


