import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { companyId, reportType } = await req.json()

    if (!companyId) {
      return new Response(JSON.stringify({ error: 'Missing company ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate compliance report
    const report = {
      companyId,
      reportType: reportType || 'full',
      generatedAt: new Date().toISOString(),
      dataBreaches: [],
      backups: [],
      securityLogs: [],
      documents: [],
    }

    // Fetch data based on report type
    if (reportType === 'full' || reportType === 'breaches') {
      const { data: breaches } = await supabaseClient
        .from('data_breaches')
        .select('*')
        .eq('company_id', companyId)
      report.dataBreaches = breaches || []
    }

    if (reportType === 'full' || reportType === 'backups') {
      const { data: backups } = await supabaseClient
        .from('backups')
        .select('*')
        .eq('company_id', companyId)
      report.backups = backups || []
    }

    if (reportType === 'full' || reportType === 'security') {
      const { data: logs } = await supabaseClient
        .from('security_logs')
        .select('*')
        .eq('user_id', user.id)
        .limit(1000)
      report.securityLogs = logs || []
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})


