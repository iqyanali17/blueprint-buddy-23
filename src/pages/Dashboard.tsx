import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, Camera, Bell, Activity, User, AlertCircle,
  Heart, Calendar, Shield, ShieldCheck, Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ChatInterface from '@/components/ChatInterface';
import SymptomChecker from '@/components/SymptomChecker';
import MedicationTracker from '@/components/MedicationTracker';
import ImageAnalysis from '@/components/ImageAnalysis';
import EmergencyGuide from '@/components/EmergencyGuide';
import HealthDashboard from '@/components/HealthDashboard';
import UserProfile from '@/components/UserProfile';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [chatResult, setChatResult] = useState<string>('');
  const { toast } = useToast();

  // Admin request state
  const [adminRequestStatus, setAdminRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected' | 'loading'>('loading');
  const [adminReason, setAdminReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkRequest = async () => {
      try {
        const { data } = await (supabase as any)
          .from('admin_requests').select('status').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
        if (data && data.length > 0) {
          setAdminRequestStatus(data[0].status);
        } else {
          setAdminRequestStatus('none');
        }
      } catch { setAdminRequestStatus('none'); }
    };
    checkRequest();
  }, [user]);

  const submitAdminRequest = async () => {
    if (!user) return;
    setSubmittingRequest(true);
    try {
      const { error } = await (supabase as any).from('admin_requests').insert({
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        reason: adminReason || null,
      });
      if (error) throw error;
      setAdminRequestStatus('pending');
      setAdminReason('');
      toast({ title: 'Request Sent', description: 'Your admin access request has been submitted for review.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to submit request', variant: 'destructive' });
    } finally { setSubmittingRequest(false); }
  };

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const dashboardSections = [
    {
      id: 'chat',
      title: 'Medical Chat',
      description: 'AI-powered medical consultation',
      icon: MessageCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      count: '24/7 Available'
    },
    {
      id: 'symptoms',
      title: 'Symptom Checker',
      description: 'Assess your symptoms',
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      count: 'Quick Assessment'
    },
    {
      id: 'medications',
      title: 'Medications',
      description: 'Track and manage medications',
      icon: Bell,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      count: 'Smart Reminders'
    },
    {
      id: 'imaging',
      title: 'Image Analysis',
      description: 'AI-powered image diagnosis',
      icon: Camera,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      count: 'Upload & Analyze'
    },
    {
      id: 'emergency',
      title: 'Emergency Guide',
      description: 'First aid and emergency help',
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      count: 'Immediate Help'
    },
    {
      id: 'health',
      title: 'Health Overview',
      description: 'Your health metrics',
      icon: Heart,
      color: 'text-pink-500',
      bgColor: 'bg-pink-50 dark:bg-pink-950/20',
      count: 'Track Progress'
    }
  ];

  const handleChatComplete = (result: string) => {
    setChatResult(result);
  };

  const handleImageAnalysisComplete = (payload: { imageDataUrl: string; result: string }) => {
    setChatResult(payload.result);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to access your medical dashboard.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Medical Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Online</span>
              </Badge>
              <Button variant="outline" size="sm" onClick={() => navigate('/support')}>
                <MessageCircle className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Contact Admin</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/doctor-chat')}>
                <Activity className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Chat with Doctor</span>
              </Button>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                  <Shield className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Admin Panel</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="inline-flex w-max sm:grid sm:w-full sm:grid-cols-7 min-w-max">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-3 sm:px-4">Overview</TabsTrigger>
              <TabsTrigger value="chat" className="text-xs sm:text-sm px-3 sm:px-4">Chat</TabsTrigger>
              <TabsTrigger value="symptoms" className="text-xs sm:text-sm px-3 sm:px-4">Symptoms</TabsTrigger>
              <TabsTrigger value="medications" className="text-xs sm:text-sm px-3 sm:px-4">Medications</TabsTrigger>
              <TabsTrigger value="imaging" className="text-xs sm:text-sm px-3 sm:px-4">Imaging</TabsTrigger>
              <TabsTrigger value="emergency" className="text-xs sm:text-sm px-3 sm:px-4">Emergency</TabsTrigger>
              <TabsTrigger value="profile" className="text-xs sm:text-sm px-3 sm:px-4">Profile</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">24/7</p>
                      <p className="text-sm text-muted-foreground">AI Support Available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                      <Heart className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">Secure</p>
                      <p className="text-sm text-muted-foreground">HIPAA Compliant</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">Today</p>
                      <p className="text-sm text-muted-foreground">Ready to Help</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {dashboardSections.map((section) => (
                <Card key={section.id} className="group hover:shadow-lg transition-all cursor-pointer" onClick={() => setActiveTab(section.id)}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <section.icon className={`w-6 h-6 ${section.color}`} />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {section.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {section.count}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          Open
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Health Overview Widget */}
            <HealthDashboard />
          </TabsContent>

          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Medical Consultation Chat
                </CardTitle>
                <CardDescription>
                  Get instant medical guidance through our AI-powered assistant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChatInterface />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="symptoms">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  Symptom Assessment
                </CardTitle>
                <CardDescription>
                  Comprehensive symptom evaluation and health recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SymptomChecker onComplete={handleChatComplete} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-purple-500" />
                  Medication Management
                </CardTitle>
                <CardDescription>
                  Track medications and set up intelligent reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MedicationTracker />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="imaging">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-orange-500" />
                  Medical Image Analysis
                </CardTitle>
                <CardDescription>
                  Upload and analyze medical images with AI assistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageAnalysis onComplete={handleImageAnalysisComplete} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergency">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Emergency & First Aid Guide
                </CardTitle>
                <CardDescription>
                  Immediate medical guidance for emergency situations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmergencyGuide />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile & Health Information
                </CardTitle>
                <CardDescription>
                  Manage your personal and medical information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserProfile />
              </CardContent>
            </Card>

            {/* Admin Request Card — only for non-admins */}
            {!isAdmin && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Request Admin Access
                  </CardTitle>
                  <CardDescription>
                    Submit a request to the platform administrator for elevated privileges.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {adminRequestStatus === 'loading' ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4 animate-spin" />Checking status…</div>
                  ) : adminRequestStatus === 'pending' ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                      <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Request Pending</p>
                        <p className="text-xs text-muted-foreground">Your admin access request is awaiting approval.</p>
                      </div>
                    </div>
                  ) : adminRequestStatus === 'approved' ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Request Approved</p>
                        <p className="text-xs text-muted-foreground">Log out and back in to activate admin privileges.</p>
                      </div>
                    </div>
                  ) : adminRequestStatus === 'rejected' ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Request Rejected</p>
                        <p className="text-xs text-muted-foreground">Your admin request was not approved by the administrator.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Why do you need admin access? (optional)"
                        value={adminReason}
                        onChange={(e) => setAdminReason(e.target.value)}
                        className="resize-none"
                        rows={3}
                      />
                      <Button onClick={submitAdminRequest} disabled={submittingRequest} size="sm">
                        <Shield className="h-4 w-4 mr-1.5" />
                        {submittingRequest ? 'Submitting…' : 'Submit Request'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;