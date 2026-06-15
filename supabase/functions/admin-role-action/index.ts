import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the caller is an admin
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error('Not authenticated');

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Check admin role
    const { data: adminRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!adminRole) throw new Error('Not authorized — admin only');

    const { requestId, action } = await req.json();
    if (!requestId || !['approve', 'reject'].includes(action)) {
      throw new Error('Invalid request: need requestId and action (approve|reject)');
    }

    // Get the request
    const { data: request, error: reqErr } = await adminClient
      .from('admin_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (reqErr || !request) throw new Error('Request not found');
    if (request.status !== 'pending') throw new Error('Request already processed');

    if (action === 'approve') {
      // Update user_roles to admin
      await adminClient
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', request.user_id);
    }

    // Update the request status
    await adminClient
      .from('admin_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    return new Response(JSON.stringify({ success: true, action }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('admin-role-action error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
