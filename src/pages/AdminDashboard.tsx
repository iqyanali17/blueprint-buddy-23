import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Activity, MessageSquare, Database, CheckCircle, XCircle, UserPlus, Stethoscope, UserMinus, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminRequest {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  reason: string | null;
  status: string;
  created_at: string;
}

interface SupportMessage {
  id: string;
  user_id: string;
  email: string | null;
  username: string | null;
  message: string;
  created_at: string;
}

interface ManagedUser {
  id: string;
  email: string;
  full_name: string | null;
  account_type: string;
  role: string;
  created_at: string;
}

interface UserCounts {
  total: number;
  patients: number;
  doctors: number;
  admins: number;
}

const AdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [support, setSupport] = useState<SupportMessage[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [userCounts, setUserCounts] = useState<UserCounts>({ total: 0, patients: 0, doctors: 0, admins: 0 });
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { checkAdminStatus(); }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }

      const { data: roleData, error } = await supabase
        .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single();

      if (error || !roleData) {
        toast({ title: "Access Denied", description: "You don't have admin privileges", variant: "destructive" });
        navigate('/'); return;
      }

      setIsAdmin(true);
      await Promise.all([loadAdminRequests(), loadUsers(), loadSupport()]);
    } catch { navigate('/'); } finally { setLoading(false); }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'list' },
      });
      if (error) throw error;
      setManagedUsers(data.users || []);
      setUserCounts(data.counts || { total: 0, patients: 0, doctors: 0, admins: 0 });
    } catch {
      toast({ title: "Error", description: "Could not load users", variant: "destructive" });
    } finally { setUsersLoading(false); }
  };

  const loadSupport = async () => {
    try {
      const supportRes = await (supabase as any).from('support_messages').select('*').order('created_at', { ascending: false }).limit(500);
      if (!supportRes.error && supportRes.data) setSupport(supportRes.data);
    } catch {}
  };

  const loadAdminRequests = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('admin_requests').select('*').order('created_at', { ascending: false });
      if (!error && data) setAdminRequests(data);
    } catch {}
  };

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingId(requestId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-role-action', {
        body: { requestId, action },
      });
      if (error) throw error;
      toast({ title: action === 'approve' ? 'Approved!' : 'Rejected', description: `Admin request has been ${action}d.` });
      await Promise.all([loadAdminRequests(), loadUsers()]);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to process request', variant: 'destructive' });
    } finally { setProcessingId(null); }
  };

  const handleRevoke = async (targetUserId: string, revokeType: 'doctor' | 'admin', email: string) => {
    setRevokingId(targetUserId + revokeType);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'revoke', targetUserId, revokeType },
      });
      if (error) throw error;
      toast({
        title: `${revokeType === 'doctor' ? 'Doctor' : 'Admin'} role revoked`,
        description: `${email} has been demoted to ${revokeType === 'doctor' ? 'patient' : 'regular user'}.`,
      });
      await loadUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to revoke role', variant: 'destructive' });
    } finally { setRevokingId(null); }
  };

  // Realtime for admin requests
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('realtime:admin-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_requests' } as any, () => {
        loadAdminRequests();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' } as any, (payload: any) => {
        setSupport(prev => [payload.new, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const pendingRequests = adminRequests.filter(r => r.status === 'pending');

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingRequests.length} pending</Badge>
            )}
          </div>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { label: 'Total Users', value: userCounts.total, icon: Users, color: 'text-primary' },
            { label: 'Patients', value: userCounts.patients, icon: Activity, color: 'text-green-600' },
            { label: 'Doctors', value: userCounts.doctors, icon: Stethoscope, color: 'text-blue-600' },
            { label: 'Admins', value: userCounts.admins, icon: Crown, color: 'text-amber-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{s.value}</div></CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Admin Requests
              {pendingRequests.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-destructive text-destructive-foreground text-[10px] px-1.5">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="support">Support Inbox</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />All Users</CardTitle>
                    <CardDescription>Manage doctors and admins. Revoke roles at any time.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadUsers} disabled={usersLoading}>
                    {usersLoading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-auto">
                  {managedUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      {usersLoading ? 'Loading users...' : 'No users found.'}
                    </p>
                  )}
                  {managedUsers.map(u => {
                    const isDoctor = u.account_type === 'doctor';
                    const isAdminUser = u.role === 'admin';
                    return (
                      <div key={u.id} className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm truncate">{u.full_name || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {isAdminUser && (
                              <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-300">Admin</Badge>
                            )}
                            {isDoctor && (
                              <Badge className="text-[10px] bg-blue-100 text-blue-800 border-blue-300">Doctor</Badge>
                            )}
                            {!isAdminUser && !isDoctor && (
                              <Badge variant="secondary" className="text-[10px]">Patient</Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {isDoctor && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs h-7"
                              disabled={revokingId === u.id + 'doctor'}
                              onClick={() => handleRevoke(u.id, 'doctor', u.email)}
                            >
                              <UserMinus className="h-3 w-3 mr-1" />Revoke Doctor
                            </Button>
                          )}
                          {isAdminUser && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs h-7"
                              disabled={revokingId === u.id + 'admin'}
                              onClick={() => handleRevoke(u.id, 'admin', u.email)}
                            >
                              <UserMinus className="h-3 w-3 mr-1" />Revoke Admin
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />Admin Role Requests</CardTitle>
                <CardDescription>Users requesting admin access. Only you can approve or reject.</CardDescription>
              </CardHeader>
              <CardContent>
                {adminRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No admin requests yet.</p>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-auto">
                    {adminRequests.map(r => (
                      <div key={r.id} className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{r.full_name || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">{r.email}</span>
                            <Badge variant={r.status === 'pending' ? 'outline' : r.status === 'approved' ? 'default' : 'destructive'} className="text-[10px]">
                              {r.status}
                            </Badge>
                          </div>
                          {r.reason && <p className="text-sm text-muted-foreground mt-1">{r.reason}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
                        </div>
                        {r.status === 'pending' && (
                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" variant="default" disabled={processingId === r.id} onClick={() => handleAction(r.id, 'approve')}>
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />Approve
                            </Button>
                            <Button size="sm" variant="destructive" disabled={processingId === r.id} onClick={() => handleAction(r.id, 'reject')}>
                              <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Support Inbox</CardTitle><CardDescription>Newest messages first</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[520px] overflow-auto">
                  {support.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No messages</p>}
                  {support.map(m => (
                    <div key={m.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{m.username || m.email || m.user_id}</span>
                        <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-sm mt-2 whitespace-pre-wrap">{m.message}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
