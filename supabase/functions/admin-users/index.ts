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

    // Verify caller
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

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    // LIST all users with roles
    if (action === 'list') {
      // Get all auth users
      const { data: { users: authUsers }, error: usersErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (usersErr) throw usersErr;

      // Get all roles
      const { data: roles } = await adminClient.from('user_roles').select('user_id, role');
      const roleMap: Record<string, string> = {};
      (roles || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });

      const userList = (authUsers || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
        account_type: u.user_metadata?.account_type || 'patient',
        role: roleMap[u.id] || 'user',
        created_at: u.created_at,
      }));

      const counts = {
        total: userList.length,
        patients: userList.filter((u: any) => u.account_type === 'patient' && u.role !== 'admin').length,
        doctors: userList.filter((u: any) => u.account_type === 'doctor').length,
        admins: userList.filter((u: any) => u.role === 'admin').length,
      };

      return new Response(JSON.stringify({ users: userList, counts }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // REVOKE: remove doctor status or admin role
    if (action === 'revoke') {
      const { targetUserId, revokeType } = body;
      if (!targetUserId || !['doctor', 'admin'].includes(revokeType)) {
        throw new Error('Need targetUserId and revokeType (doctor|admin)');
      }

      // Prevent revoking own admin
      if (targetUserId === user.id && revokeType === 'admin') {
        throw new Error('Cannot revoke your own admin role');
      }

      if (revokeType === 'admin') {
        // Set role back to 'user'
        await adminClient
          .from('user_roles')
          .update({ role: 'user' })
          .eq('user_id', targetUserId);
      }

      if (revokeType === 'doctor') {
        // Update user metadata to patient
        await adminClient.auth.admin.updateUserById(targetUserId, {
          user_metadata: { account_type: 'patient' },
        });
      }

      return new Response(JSON.stringify({ success: true, revokeType }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Unknown action');
  } catch (error) {
    console.error('admin-users error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
