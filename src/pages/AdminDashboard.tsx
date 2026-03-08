import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Activity, MessageSquare, CheckCircle, XCircle, UserPlus, Stethoscope, UserMinus, Crown, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminRequest {
  id: string; user_id: string; email: string; full_name: string | null;
  reason: string | null; status: string; created_at: string;
}
interface ManagedUser {
  id: string; email: string; full_name: string | null;
  account_type: string; role: string; created_at: string;
}
interface UserCounts { total: number; patients: number; doctors: number; admins: number; }
interface SupportTicket {
  id: string; user_id: string; email: string | null; username: string | null;
  subject: string; status: string; created_at: string;
}
interface TicketMsg {
  id: string; ticket_id: string; sender_id: string; sender_type: string;
  content: string; created_at: string;
}

const AdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [userCounts, setUserCounts] = useState<UserCounts>({ total: 0, patients: 0, doctors: 0, admins: 0 });
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  // Support tickets
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMsg[]>([]);
  const [adminReply, setAdminReply] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { checkAdminStatus(); }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }
      setCurrentUserId(user.id);
      const { data: roleData, error } = await supabase
        .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single();
      if (error || !roleData) {
        toast({ title: "Access Denied", description: "You don't have admin privileges", variant: "destructive" });
        navigate('/'); return;
      }
      setIsAdmin(true);
      await Promise.all([loadAdminRequests(), loadUsers(), loadTickets()]);
    } catch { navigate('/'); } finally { setLoading(false); }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', { body: { action: 'list' } });
      if (error) throw error;
      setManagedUsers(data.users || []);
      setUserCounts(data.counts || { total: 0, patients: 0, doctors: 0, admins: 0 });
    } catch {
      toast({ title: "Error", description: "Could not load users", variant: "destructive" });
    } finally { setUsersLoading(false); }
  };

  const loadTickets = async () => {
    const { data } = await (supabase as any).from('support_tickets').select('*').order('updated_at', { ascending: false });
    if (data) setTickets(data);
  };

  const loadTicketMessages = async (ticketId: string) => {
    const { data } = await (supabase as any)
      .from('support_ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    if (data) setTicketMessages(data);
  };

  useEffect(() => {
    if (selectedTicket) loadTicketMessages(selectedTicket);
  }, [selectedTicket]);

  // Realtime for ticket messages
  useEffect(() => {
    if (!selectedTicket) return;
    const channel = supabase
      .channel(`admin-ticket-${selectedTicket}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'support_ticket_messages',
        filter: `ticket_id=eq.${selectedTicket}`,
      } as any, (payload: any) => {
        setTicketMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketMessages]);

  const sendAdminReply = async () => {
    if (!currentUserId || !selectedTicket || !adminReply.trim()) return;
    const { error } = await (supabase as any).from('support_ticket_messages').insert({
      ticket_id: selectedTicket,
      sender_id: currentUserId,
      sender_type: 'admin',
      content: adminReply.trim(),
    });
    if (!error) setAdminReply('');
  };

  const closeTicket = async (ticketId: string) => {
    await (supabase as any).from('support_tickets').update({ status: 'closed' }).eq('id', ticketId);
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t));
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
      const { error } = await supabase.functions.invoke('admin-role-action', { body: { requestId, action } });
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
      const { error } = await supabase.functions.invoke('admin-users', { body: { action: 'revoke', targetUserId, revokeType } });
      if (error) throw error;
      toast({ title: `${revokeType === 'doctor' ? 'Doctor' : 'Admin'} role revoked`, description: `${email} demoted.` });
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_requests' } as any, () => loadAdminRequests())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' } as any, (payload: any) => {
        setTickets(prev => [payload.new, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const pendingRequests = adminRequests.filter(r => r.status === 'pending');
  const currentTicket = tickets.find(t => t.id === selectedTicket);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
       <header className="border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold truncate">Admin Dashboard</h1>
            {pendingRequests.length > 0 && <Badge variant="destructive" className="ml-1 sm:ml-2 flex-shrink-0">{pendingRequests.length} pending</Badge>}
          </div>
          <Button size="sm" className="flex-shrink-0 text-xs sm:text-sm" onClick={() => navigate('/dashboard')}>Back</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
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

        <Tabs defaultValue="support" className="space-y-4">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="support" className="relative flex-1 min-w-[100px] text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              Support Inbox
              {tickets.filter(t => t.status === 'open').length > 0 && (
                <span className="ml-1 sm:ml-1.5 inline-flex items-center justify-center h-4 sm:h-5 min-w-[16px] sm:min-w-[20px] rounded-full bg-destructive text-destructive-foreground text-[9px] sm:text-[10px] px-1">
                  {tickets.filter(t => t.status === 'open').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 min-w-[100px] text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">User Management</TabsTrigger>
            <TabsTrigger value="requests" className="relative flex-1 min-w-[100px] text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">
              Admin Requests
              {pendingRequests.length > 0 && (
                <span className="ml-1 sm:ml-1.5 inline-flex items-center justify-center h-4 sm:h-5 min-w-[16px] sm:min-w-[20px] rounded-full bg-destructive text-destructive-foreground text-[9px] sm:text-[10px] px-1">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Support Inbox with reply */}
          <TabsContent value="support" className="space-y-4">
            <Card>
              <div className="grid md:grid-cols-3 min-h-[500px]">
                <div className="border-r p-4 space-y-2 max-h-[560px] overflow-y-auto">
                  <h3 className="font-semibold text-sm mb-2">Tickets</h3>
                  {tickets.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tickets</p>}
                  {tickets.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTicket(t.id)}
                      className={`w-full text-left rounded-lg p-3 border transition-colors ${selectedTicket === t.id ? 'bg-muted border-primary/30' : 'hover:bg-muted/50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold truncate">{t.username || t.email || 'Unknown'}</span>
                        <Badge variant={t.status === 'open' ? 'default' : 'secondary'} className="text-[10px]">{t.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.subject}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
                <div className="md:col-span-2 p-4 flex flex-col">
                  {currentTicket ? (
                    <>
                      <div className="flex items-center justify-between mb-3 pb-3 border-b">
                        <div>
                          <h3 className="font-semibold">{currentTicket.username || currentTicket.email}</h3>
                          <p className="text-xs text-muted-foreground">{currentTicket.subject} — {currentTicket.email}</p>
                        </div>
                        {currentTicket.status === 'open' && (
                          <Button variant="outline" size="sm" onClick={() => closeTicket(currentTicket.id)}>Close Ticket</Button>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3 max-h-[380px]">
                        {ticketMessages.map(m => (
                          <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.sender_type === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted border'}`}>
                              {m.sender_type !== 'admin' && <p className="text-[10px] font-bold mb-0.5 opacity-80">User</p>}
                              {m.content}
                              <p className="text-[9px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEnd} />
                      </div>
                      {currentTicket.status === 'open' && (
                        <div className="mt-3 flex items-center gap-2">
                          <Input
                            value={adminReply}
                            onChange={e => setAdminReply(e.target.value)}
                            placeholder="Type your reply..."
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendAdminReply()}
                          />
                          <Button onClick={sendAdminReply} disabled={!adminReply.trim()} size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Select a ticket to view conversation</div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* User Management */}
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
                  {managedUsers.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">{usersLoading ? 'Loading...' : 'No users.'}</p>}
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
                            {isAdminUser && <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-300">Admin</Badge>}
                            {isDoctor && <Badge className="text-[10px] bg-blue-100 text-blue-800 border-blue-300">Doctor</Badge>}
                            {!isAdminUser && !isDoctor && <Badge variant="secondary" className="text-[10px]">Patient</Badge>}
                            <span className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {isDoctor && (
                            <Button size="sm" variant="destructive" className="text-xs h-7" disabled={revokingId === u.id + 'doctor'} onClick={() => handleRevoke(u.id, 'doctor', u.email)}>
                              <UserMinus className="h-3 w-3 mr-1" />Revoke Doctor
                            </Button>
                          )}
                          {isAdminUser && (
                            <Button size="sm" variant="destructive" className="text-xs h-7" disabled={revokingId === u.id + 'admin'} onClick={() => handleRevoke(u.id, 'admin', u.email)}>
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

          {/* Admin Requests */}
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />Admin Role Requests</CardTitle>
                <CardDescription>Only you can approve or reject.</CardDescription>
              </CardHeader>
              <CardContent>
                {adminRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No requests yet.</p>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-auto">
                    {adminRequests.map(r => (
                      <div key={r.id} className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{r.full_name || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">{r.email}</span>
                            <Badge variant={r.status === 'pending' ? 'outline' : r.status === 'approved' ? 'default' : 'destructive'} className="text-[10px]">{r.status}</Badge>
                          </div>
                          {r.reason && <p className="text-sm text-muted-foreground mt-1">{r.reason}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
                        </div>
                        {r.status === 'pending' && (
                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" disabled={processingId === r.id} onClick={() => handleAction(r.id, 'approve')}>
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
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
