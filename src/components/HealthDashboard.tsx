import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  Activity, 
  Pill, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface HealthMetrics {
  medicationsActive: number;
  upcomingAppointments: number;
  recentSymptomChecks: number;
  emergencyContacts: number;
}

interface RecentActivity {
  id: string;
  type: 'medication' | 'symptom' | 'appointment' | 'analysis';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'overdue';
}

const HealthDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<HealthMetrics>({
    medicationsActive: 0,
    upcomingAppointments: 0,
    recentSymptomChecks: 0,
    emergencyContacts: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load medications count
      const { data: medications } = await supabase
        .from('medication_reminders')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Load symptom assessments count (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: symptoms } = await supabase
        .from('symptom_assessments')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Load recent chat sessions for activity
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setMetrics({
        medicationsActive: medications?.length || 0,
        upcomingAppointments: 0, // Mock data
        recentSymptomChecks: symptoms?.length || 0,
        emergencyContacts: 1 // Mock data
      });

      // Generate recent activity from sessions
      const activities: RecentActivity[] = (sessions || []).map((session, index) => ({
        id: session.id,
        type: session.session_type === 'symptom_check' ? 'symptom' : 
              session.session_type === 'medication' ? 'medication' : 'analysis',
        title: session.title || `${session.session_type} consultation`,
        description: `Started ${new Date(session.created_at).toLocaleDateString()}`,
        timestamp: session.created_at,
        status: 'completed' as const
      }));

      setRecentActivity(activities);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'medication': return <Pill className="h-4 w-4" />;
      case 'symptom': return <Activity className="h-4 w-4" />;
      case 'appointment': return <Calendar className="h-4 w-4" />;
      case 'analysis': return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: RecentActivity['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'overdue': return 'text-red-600';
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to view your health dashboard</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading your health dashboard...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-medical/5 to-healing/5 border-medical/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Welcome back, {user.user_metadata?.full_name || 'there'}!
              </CardTitle>
              <CardDescription className="text-lg">
                Here's your health overview for today
              </CardDescription>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="border-medical text-medical">
                <Heart className="h-3 w-3 mr-1" />
                Health Score: 85%
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-medical">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Medications</p>
                <p className="text-2xl font-bold text-medical">{metrics.medicationsActive}</p>
              </div>
              <Pill className="h-8 w-8 text-medical" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-healing">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Symptom Checks (30d)</p>
                <p className="text-2xl font-bold text-healing">{metrics.recentSymptomChecks}</p>
              </div>
              <Activity className="h-8 w-8 text-healing" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Appointments</p>
                <p className="text-2xl font-bold text-primary">{metrics.upcomingAppointments}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emergency">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emergency Contacts</p>
                <p className="text-2xl font-bold text-emergency">{metrics.emergencyContacts}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-emergency" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest health interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Start using MEDITALK to see your activity here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(activity.status)}`}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Health Goals
            </CardTitle>
            <CardDescription>
              Track your wellness progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Medication Adherence</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Regular Check-ups</span>
                <span>60%</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Health Monitoring</span>
                <span>90%</span>
              </div>
              <Progress value={90} className="h-2" />
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full">
                Set New Health Goals
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your health
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Activity className="h-6 w-6 text-medical" />
              <span className="text-sm">Symptom Check</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Pill className="h-6 w-6 text-healing" />
              <span className="text-sm">Add Medication</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="text-sm">Schedule Appointment</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <User className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm">Update Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthDashboard;