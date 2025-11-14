import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { eventType, userId, metadata } = await req.json()

    if (!eventType || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get user email
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send email based on event type
    let emailSubject = ''
    let emailBody = ''

    switch (eventType) {
      case 'subscription_created':
        emailSubject = 'Subscription Activated'
        emailBody = `<p>Your subscription has been activated successfully.</p>`
        break
      case 'invoice_paid':
        emailSubject = 'Invoice Paid'
        emailBody = `<p>Your invoice has been paid successfully.</p>`
        break
      case 'data_breach_detected':
        emailSubject = 'Data Breach Detected'
        emailBody = `<p>A data breach has been detected in your account. Please review immediately.</p>`
        break
      default:
        emailSubject = 'Notification'
        emailBody = `<p>You have a new notification.</p>`
    }

    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@example.com',
          to: user.email,
          subject: emailSubject,
          html: emailBody,
        }),
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})


