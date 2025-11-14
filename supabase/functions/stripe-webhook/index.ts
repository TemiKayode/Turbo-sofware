import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response(JSON.stringify({ error: 'No signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.text()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const companyId = session.metadata?.company_id

        if (companyId && session.subscription) {
          // Get subscription details from Stripe
          const subscriptionId = session.subscription as string
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const priceId = subscription.items.data[0]?.price?.id || ''

          // Get price details to determine tier
          let tier = 'basic'
          if (priceId) {
            const price = await stripe.prices.retrieve(priceId)
            const priceAmount = price.unit_amount || 0

            // Determine tier based on price amount (in cents)
            if (priceAmount >= 29900) {
              tier = 'enterprise'
            } else if (priceAmount >= 9900) {
              tier = 'professional'
            } else if (priceAmount >= 2900) {
              tier = 'basic'
            } else {
              tier = 'free'
            }
          }

          // Update limits based on tier
          const limits: Record<string, { users: number; companies: number; documents: number }> = {
            free: { users: 1, companies: 1, documents: 10 },
            basic: { users: 5, companies: 3, documents: 100 },
            professional: { users: 25, companies: 10, documents: 1000 },
            enterprise: { users: 100, companies: 50, documents: 10000 },
          }

          const limit = limits[tier] || limits.free

          const { error: updateError } = await supabaseClient
            .from('companies')
            .update({
              stripe_subscription_id: subscriptionId,
              subscription_tier: tier,
              max_users: limit.users,
              max_companies: limit.companies,
              max_documents: limit.documents,
            })
            .eq('id', companyId)

          if (updateError) {
            console.error('Error updating company subscription:', updateError)
          }
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Find company by customer ID
        const { data: company } = await supabaseClient
          .from('companies')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (company) {
          // Check if invoice already exists to avoid duplicates
          const { data: existingInvoice } = await supabaseClient
            .from('invoices')
            .select('id')
            .eq('stripe_invoice_id', invoice.id)
            .single()

          if (!existingInvoice) {
            // Create invoice record
            const { error: insertError } = await supabaseClient.from('invoices').insert({
              company_id: company.id,
              stripe_invoice_id: invoice.id,
              amount: invoice.amount_paid || invoice.total,
              currency: invoice.currency || 'usd',
              status: 'paid',
              paid_at: new Date().toISOString(),
              due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
            })

            if (insertError) {
              console.error('Error inserting invoice:', insertError)
            }
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: company } = await supabaseClient
          .from('companies')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (company) {
          // Check if invoice already exists
          const { data: existingInvoice } = await supabaseClient
            .from('invoices')
            .select('id')
            .eq('stripe_invoice_id', invoice.id)
            .single()

          if (!existingInvoice) {
            const { error: insertError } = await supabaseClient.from('invoices').insert({
              company_id: company.id,
              stripe_invoice_id: invoice.id,
              amount: invoice.amount_due || invoice.total,
              currency: invoice.currency || 'usd',
              status: 'open',
              due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
            })

            if (insertError) {
              console.error('Error inserting failed invoice:', insertError)
            }
          } else {
            // Update existing invoice status
            await supabaseClient
              .from('invoices')
              .update({ status: 'open' })
              .eq('stripe_invoice_id', invoice.id)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: company } = await supabaseClient
          .from('companies')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (company) {
          // Downgrade to free tier
          await supabaseClient
            .from('companies')
            .update({
              subscription_tier: 'free',
              stripe_subscription_id: null,
              max_users: 1,
              max_companies: 1,
              max_documents: 10,
            })
            .eq('id', company.id)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

