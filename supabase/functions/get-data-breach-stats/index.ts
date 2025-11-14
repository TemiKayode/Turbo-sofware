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

    const { companyId, startDate, endDate } = await req.json()

    let query = supabaseClient.from('data_breaches').select('*')

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    if (startDate) {
      query = query.gte('detected_at', startDate)
    }

    if (endDate) {
      query = query.lte('detected_at', endDate)
    }

    const { data: breaches, error: breachError } = await query

    if (breachError) {
      throw breachError
    }

    const stats = {
      total: breaches?.length || 0,
      unresolved: breaches?.filter((b) => !b.resolved_at).length || 0,
      bySeverity: {
        critical: breaches?.filter((b) => b.severity === 'critical').length || 0,
        high: breaches?.filter((b) => b.severity === 'high').length || 0,
        medium: breaches?.filter((b) => b.severity === 'medium').length || 0,
        low: breaches?.filter((b) => b.severity === 'low').length || 0,
      },
      totalAffectedRecords: breaches?.reduce((sum, b) => sum + (b.affected_records || 0), 0) || 0,
      averageResolutionTime: 0, // Calculate from resolved breaches
    }

    return new Response(JSON.stringify({ stats, breaches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})


