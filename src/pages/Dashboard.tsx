import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Camera, 
  Bell, 
  Activity, 
  User, 
  AlertCircle,
  Heart,
  Calendar,
  FileText,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ChatInterface from '@/components/ChatInterface';
import SymptomChecker from '@/components/SymptomChecker';
import MedicationTracker from '@/components/MedicationTracker';
import ImageAnalysis from '@/components/ImageAnalysis';
import EmergencyGuide from '@/components/EmergencyGuide';
import HealthDashboard from '@/components/HealthDashboard';
import UserProfile from '@/components/UserProfile';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [chatResult, setChatResult] = useState<string>('');

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Medical Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Online</span>
              </Badge>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="imaging">Imaging</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <ImageAnalysis onComplete={handleChatComplete} />
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

          <TabsContent value="profile">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;