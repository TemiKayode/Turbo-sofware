import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PRICING_TIERS = {
  free: { price: 0, maxUsers: 1, maxCompanies: 1, maxDocuments: 10 },
  basic: { price: 29, maxUsers: 5, maxCompanies: 3, maxDocuments: 100 },
  professional: { price: 99, maxUsers: 25, maxCompanies: 10, maxDocuments: 1000 },
  enterprise: { price: 299, maxUsers: 100, maxCompanies: 50, maxDocuments: 10000 },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tierId, billingCycle, addons } = await req.json()

    if (!tierId) {
      return new Response(JSON.stringify({ error: 'Missing tier ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const tier = PRICING_TIERS[tierId as keyof typeof PRICING_TIERS]
    if (!tier) {
      return new Response(JSON.stringify({ error: 'Invalid tier' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let basePrice = tier.price
    if (billingCycle === 'yearly') {
      basePrice = Math.round(basePrice * 12 * 0.8) // 20% discount
    } else {
      basePrice = basePrice
    }

    // Calculate addon costs
    let addonCost = 0
    if (addons) {
      if (addons.extraUsers) {
        addonCost += addons.extraUsers * 5 // $5 per additional user
      }
      if (addons.extraStorage) {
        addonCost += addons.extraStorage * 10 // $10 per 100GB
      }
    }

    const subtotal = basePrice + addonCost
    const tax = Math.round(subtotal * 0.1) // 10% tax (example)
    const finalPrice = subtotal + tax

    return new Response(
      JSON.stringify({
        tier: tierId,
        billingCycle: billingCycle || 'monthly',
        basePrice,
        addonCost,
        subtotal,
        tax,
        totalPrice: finalPrice,
        limits: {
          maxUsers: tier.maxUsers,
          maxCompanies: tier.maxCompanies,
          maxDocuments: tier.maxDocuments,
        },
        breakdown: {
          base: basePrice,
          addons: addonCost,
          tax: tax,
          total: finalPrice,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

