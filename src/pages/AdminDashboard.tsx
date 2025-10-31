import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Activity, MessageSquare, Database, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalMessages: number;
  activeToday: number;
}

interface Presence {
  user_id: string;
  email: string | null;
  username: string | null;
  is_online: boolean;
  last_seen: string;
}

interface UserLog {
  id: string;
  user_id: string;
  email: string | null;
  username: string | null;
  login_time: string;
  status: 'logged_in' | 'logged_out';
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

const AdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSessions: 0,
    totalMessages: 0,
    activeToday: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const [liveUsers, setLiveUsers] = useState<Presence[]>([]);
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [support, setSupport] = useState<SupportMessage[]>([]);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/');
        return;
      }

      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error || !roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await loadStats();
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [usersRes, sessionsRes, messagesRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('chat_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: activeTodayCount } = await supabase
        .from('chat_sessions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats({
        totalUsers: usersRes.count || 0,
        totalSessions: sessionsRes.count || 0,
        totalMessages: messagesRes.count || 0,
        activeToday: activeTodayCount || 0,
      });
      // Load admin monitoring datasets
      const [presenceRes, logsRes, supportRes] = await Promise.all([
        (supabase as any)
          .from('user_presence')
          .select('*')
          .eq('is_online', true)
          .order('last_seen', { ascending: false }),
        (supabase as any)
          .from('user_logs')
          .select('*')
          .order('login_time', { ascending: false })
          .limit(500),
        (supabase as any)
          .from('support_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500),
      ]);
      if (!presenceRes.error && presenceRes.data) setLiveUsers(presenceRes.data as Presence[]);
      if (!logsRes.error && logsRes.data) setLogs(logsRes.data as UserLog[]);
      if (!supportRes.error && supportRes.data) setSupport(supportRes.data as SupportMessage[]);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error loading statistics",
        description: "Could not load dashboard data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('realtime:admin-monitor')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_presence' } as any, (payload: any) => {
        const row = payload.new as Presence;
        setLiveUsers(prev => {
          const filtered = prev.filter(p => p.user_id !== row.user_id);
          return row.is_online ? [row, ...filtered] : filtered;
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_presence' } as any, (payload: any) => {
        const row = payload.new as Presence;
        setLiveUsers(prev => {
          const others = prev.filter(p => p.user_id !== row.user_id);
          return row.is_online ? [row, ...others] : others;
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_logs' } as any, (payload: any) => {
        const row = payload.new as UserLog;
        setLogs(prev => [row, ...prev]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' } as any, (payload: any) => {
        const row = payload.new as SupportMessage;
        setSupport(prev => [row, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeToday}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="live">Live Users</TabsTrigger>
            <TabsTrigger value="logs">Login History</TabsTrigger>
            <TabsTrigger value="support">Support Inbox</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>
                  Key metrics and system health information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Platform Status</span>
                    <span className="text-sm font-medium text-green-600">Operational</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database Status</span>
                    <span className="text-sm font-medium text-green-600">Connected</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Service</span>
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="live" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Currently Logged-in Users</CardTitle>
                <CardDescription>Live list updates in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {liveUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground">No users online.</p>
                  )}
                  {liveUsers.map(u => (
                    <div key={u.user_id} className="flex items-center justify-between border rounded-md px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{u.username || u.email || u.user_id}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                      <div className="text-xs flex items-center gap-1"><Clock className="h-3 w-3"/> {new Date(u.last_seen).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Login History</CardTitle>
                <CardDescription>Sorted by most recent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[520px] overflow-auto">
                  {logs.map(l => (
                    <div key={l.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                      <div>
                        <div className="text-sm font-medium">{l.username || l.email || l.user_id}</div>
                        <div className="text-xs text-muted-foreground">{l.email} • {l.status}</div>
                      </div>
                      <div className="text-xs flex items-center gap-1"><Clock className="h-3 w-3"/> {new Date(l.login_time || l.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Support Inbox</CardTitle>
                <CardDescription>Newest messages first. Updates in real-time.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[520px] overflow-auto">
                  {support.map(m => (
                    <div key={m.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{m.username || m.email || m.user_id}</div>
                        <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
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
