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

    const { backupId } = await req.json()

    if (!backupId) {
      return new Response(JSON.stringify({ error: 'Missing backup ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get backup
    const { data: backup, error: backupError } = await supabaseClient
      .from('backups')
      .select('*')
      .eq('id', backupId)
      .single()

    if (backupError || !backup) {
      return new Response(JSON.stringify({ error: 'Backup not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate backup integrity
    // In a real implementation, you would:
    // 1. Download backup file
    // 2. Verify checksum
    // 3. Verify encryption
    // 4. Check file structure

    const isValid = backup.status === 'completed' && backup.file_path !== null

    return new Response(
      JSON.stringify({
        valid: isValid,
        backupId,
        status: backup.status,
        filePath: backup.file_path,
        createdAt: backup.created_at,
        completedAt: backup.completed_at,
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


