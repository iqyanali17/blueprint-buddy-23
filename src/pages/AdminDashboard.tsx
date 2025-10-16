import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Activity, MessageSquare, Database } from 'lucide-react';
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
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error loading statistics",
        description: "Could not load dashboard data",
        variant: "destructive",
      });
    }
  };

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
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
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

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  User management features will be displayed here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Session Activity</CardTitle>
                <CardDescription>
                  Monitor chat sessions and interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Session activity data will be displayed here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
