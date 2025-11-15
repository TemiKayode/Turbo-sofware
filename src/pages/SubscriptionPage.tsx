import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Layout } from '@/components/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageSkeleton } from '@/components/LoadingSkeleton'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toaster'
import { PRICING_TIERS, calculatePrice, getStripePriceId, stripePromise } from '@/lib/stripe'
import { Check, CheckCircle2 } from 'lucide-react'
import type { Database } from '@/lib/supabase'

type Company = Database['public']['Tables']['companies']['Row']

const stripePromiseInstance = stripePromise

function CheckoutForm({ company, onSuccess }: { company: Company; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)

    try {
      const selectedTier = PRICING_TIERS.find(t => t.id !== 'free')
      if (!selectedTier) return

      const priceId = getStripePriceId(selectedTier.id, billingCycle)
      if (!priceId) {
        toast('Stripe price ID not configured', 'error')
        return
      }

      // Create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          companyId: company.id,
          priceId,
          billingCycle,
        },
      })

      if (error) throw error

      if (data?.sessionId) {
        const { error: redirectError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        })

        if (redirectError) throw redirectError
      }
    } catch (error: any) {
      toast(error.message || 'Failed to create checkout session', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Billing Cycle</label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={billingCycle}
          onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'yearly')}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly (20% discount)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Card Details</label>
        <div className="border rounded-md p-3">
          <CardElement />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={!stripe || loading}>
        {loading ? 'Processing...' : 'Subscribe'}
      </Button>
    </form>
  )
}

export function SubscriptionPage() {
  const { user, companyId } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false)
        if (!companyId) {
          toast('No company associated with your account. Please create a company first.', 'default')
        }
      }
    }, 5000)

    fetchCompany()

    return () => clearTimeout(timeoutId)
  }, [user, companyId])

  const fetchCompany = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      // Get user's company_id if not in context
      let userCompanyId = companyId
      
      if (!userCompanyId) {
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single()
        
        if (userData?.company_id) {
          userCompanyId = userData.company_id
        } else {
          // User doesn't have a company - create one automatically
          const companyName = user.email?.split('@')[0] + "'s Company"
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({
              name: companyName,
              owner_id: user.id,
              subscription_tier: 'free',
              max_users: 1,
              max_companies: 1,
              max_documents: 10,
            })
            .select()
            .single()
          
          if (companyError) throw companyError
          if (newCompany) {
            userCompanyId = newCompany.id
            // Update user's company_id
            await supabase
              .from('users')
              .update({ company_id: newCompany.id })
              .eq('id', user.id)
            
            // Refresh user data in context
            if (window.location) {
              setTimeout(() => window.location.reload(), 500)
            }
          }
        }
      }

      if (!userCompanyId) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userCompanyId)
        .single()

      if (error) throw error
      setCompany(data)
    } catch (error: any) {
      toast(error.message || 'Failed to fetch company', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Layout><div>Loading...</div></Layout>
  }

  if (!company && !loading) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-6">Subscription</h1>
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                Setting up your company...
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  if (!company) {
    return null
  }

  const currentTier = PRICING_TIERS.find(t => t.id === company.subscription_tier)

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscription</h1>

        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge className="bg-[#2CA01C] text-white text-lg px-4 py-1">
                {company.subscription_tier.toUpperCase()}
              </Badge>
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Max Users:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">{company.max_users}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Max Companies:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">{company.max_companies}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Max Documents:</span>
                  <span className="ml-2 font-semibold text-gray-900 dark:text-white">{company.max_documents}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Available Plans</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PRICING_TIERS.map((tier) => {
              const isCurrent = tier.id === company.subscription_tier
              const isPopular = tier.id === 'pro'
              return (
                <Card 
                  key={tier.id} 
                  className={`relative transition-all hover:shadow-lg ${
                    isCurrent 
                      ? 'border-2 border-[#2CA01C] shadow-lg scale-105' 
                      : isPopular
                      ? 'border-2 border-blue-200 dark:border-blue-800'
                      : ''
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-[#2CA01C] text-white px-3 py-1">Current Plan</Badge>
                    </div>
                  )}
                  {isPopular && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-blue-500 text-white px-3 py-1">Popular</Badge>
                    </div>
                  )}
                  <CardHeader className={isCurrent ? 'bg-[#2CA01C]/5 dark:bg-[#2CA01C]/10' : ''}>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${tier.price}
                      </span>
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">/month</span>
                    </div>
                    {tier.id !== 'free' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Billed monthly
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm mb-6 min-h-[200px]">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-[#2CA01C] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {tier.id !== company.subscription_tier && tier.id !== 'free' && (
                      <Button 
                        className="w-full bg-[#2CA01C] hover:bg-[#1e7a0f] text-white font-semibold"
                      >
                        Upgrade to {tier.name}
                      </Button>
                    )}
                    {tier.id === 'free' && isCurrent && (
                      <Button variant="outline" className="w-full" disabled>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Current Plan
                      </Button>
                    )}
                    {tier.id !== 'free' && isCurrent && (
                      <Button variant="outline" className="w-full" disabled>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Active
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {stripePromiseInstance && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Subscribe to Plan</CardTitle>
              <CardDescription>Enter your payment details to subscribe</CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromiseInstance}>
                <CheckoutForm company={company} onSuccess={fetchCompany} />
              </Elements>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}


