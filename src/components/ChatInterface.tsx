import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Mic, Camera, AlertCircle, Bot, User, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { AuthModal } from '@/components/auth/AuthModal';
import { toast } from '@/hooks/use-toast';
import SymptomChecker from './SymptomChecker';
import MedicationTracker from './MedicationTracker';
import EmergencyGuide from './EmergencyGuide';
import ImageAnalysis from './ImageAnalysis';
import HealthDashboard from './HealthDashboard';
import UserProfile from './UserProfile';

const ChatInterface = () => {
  const { user } = useAuth();
  const { messages, currentSession, sessions, loading, createSession, sendMessage, setCurrentSession } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const [currentView, setCurrentView] = useState<'chat' | 'symptoms' | 'medications' | 'emergency' | 'image' | 'dashboard' | 'profile'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start chatting with MEDITALK.",
        variant: "destructive",
      });
      return;
    }

    if (!currentSession) {
      await createSession('Medical Consultation');
    }

    await sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleStartNewChat = async () => {
    if (!user) return;
    await createSession('New Consultation');
    setCurrentView('chat');
  };

  const handleQuickAction = (type: 'symptoms' | 'medications' | 'emergency' | 'image' | 'dashboard' | 'profile') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access this feature.",
        variant: "destructive",
      });
      return;
    }
    setCurrentView(type);
  };

  const handleSymptomComplete = async (assessment: string) => {
    if (!currentSession) {
      await createSession('Symptom Assessment');
    }
    await sendMessage(assessment);
    setCurrentView('chat');
  };

  const handleImageComplete = async (result: string) => {
    if (!currentSession) {
      await createSession('Image Analysis');
    }
    await sendMessage(result);
    setCurrentView('chat');
  };

  // Demo messages for non-authenticated users
  const demoMessages = [
    {
      id: '1',
      sender: 'assistant',
      content: "Hello! I'm MEDITALK, your AI healthcare assistant. I can help you with symptom assessment, medical guidance, and health questions. How can I assist you today?",
      created_at: new Date().toISOString(),
    }
  ];

  const displayMessages = user ? messages : demoMessages;

  if (currentView === 'symptoms') {
    return (
      <section id="chat" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-medical text-medical">
              Symptom Checker
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Check Your Symptoms</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Help us understand your symptoms for personalized medical guidance.
            </p>
          </div>
          <div className="max-w-4xl mx-auto mb-6">
            <Button onClick={() => setCurrentView('chat')} variant="outline">
              ← Back to Chat
            </Button>
          </div>
          <SymptomChecker onComplete={handleSymptomComplete} />
        </div>
      </section>
    );
  }

  if (currentView === 'medications') {
    return (
      <section id="chat" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-healing text-healing">
              Medication Tracker
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Manage Your Medications</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Track your medications and set up reminders.
            </p>
          </div>
          <div className="max-w-4xl mx-auto mb-6">
            <Button onClick={() => setCurrentView('chat')} variant="outline">
              ← Back to Chat
            </Button>
          </div>
          <MedicationTracker />
        </div>
      </section>
    );
  }

  if (currentView === 'emergency') {
    return (
      <section id="chat" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-emergency text-emergency">
              Emergency Guide
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Emergency Medical Guide</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Quick reference for medical emergencies and important contacts.
            </p>
          </div>
          <div className="max-w-4xl mx-auto mb-6">
            <Button onClick={() => setCurrentView('chat')} variant="outline">
              ← Back to Chat
            </Button>
          </div>
          <EmergencyGuide />
        </div>
      </section>
    );
  }

  if (currentView === 'image') {
    return (
      <section id="chat" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-primary text-primary">
              Image Analysis
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Medical Image Analysis</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload medical images for AI-powered analysis and insights.
            </p>
          </div>
          <div className="max-w-4xl mx-auto mb-6">
            <Button onClick={() => setCurrentView('chat')} variant="outline">
              ← Back to Chat
            </Button>
          </div>
          <ImageAnalysis onComplete={handleImageComplete} />
        </div>
      </section>
    );
  }

  if (currentView === 'dashboard') {
    return (
      <section id="chat" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-medical text-medical">
              Health Dashboard
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Your Health Overview</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Track your health metrics and view personalized insights.
            </p>
          </div>
          <div className="max-w-4xl mx-auto mb-6">
            <Button onClick={() => setCurrentView('chat')} variant="outline">
              ← Back to Chat
            </Button>
          </div>
          <HealthDashboard />
        </div>
      </section>
    );
  }

  if (currentView === 'profile') {
    return (
      <section id="chat" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 border-healing text-healing">
              Medical Profile
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Manage Your Profile</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Update your medical information and personal details.
            </p>
          </div>
          <div className="max-w-4xl mx-auto mb-6">
            <Button onClick={() => setCurrentView('chat')} variant="outline">
              ← Back to Chat
            </Button>
          </div>
          <UserProfile />
        </div>
      </section>
    );
  }

  return (
    <section id="chat" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-healing text-healing">
            {user ? 'Your Medical Assistant' : 'Live Demo'}
          </Badge>
          <h2 className="text-3xl font-bold mb-4">
            {user ? 'Chat with MEDITALK' : 'Try MEDITALK Now'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {user 
              ? 'Your personal AI medical assistant is ready to help with symptoms, medications, and health questions.'
              : 'Experience our AI medical assistant with this interactive demo. Sign up for personalized medical guidance.'
            }
          </p>
        </div>

        <Card className="max-w-4xl mx-auto shadow-2xl border-0 bg-background">
          <div className="flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-6 border-b bg-gradient-to-r from-medical/5 to-healing/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-medical to-healing flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">MEDITALK Assistant</h3>
                    <p className="text-sm text-muted-foreground">
                      {user ? `Hello, ${user.user_metadata?.full_name || 'there'}` : 'Demo Mode'} • Always Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {user && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartNewChat}
                      className="border-medical text-medical hover:bg-medical hover:text-white"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      New Chat
                    </Button>
                  )}
                  <Badge variant="secondary" className="bg-healing/10 text-healing border-healing/20">
                    AI Powered
                  </Badge>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!user && (
                <div className="text-center py-8">
                  <Bot className="h-16 w-16 mx-auto text-medical/60 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Welcome to MEDITALK Demo</h3>
                  <p className="text-muted-foreground mb-4">
                    This is a preview of our AI medical assistant. Sign up for personalized medical guidance and chat history.
                  </p>
                  <AuthModal
                    trigger={
                      <Button variant="medical">
                        Get Started with MEDITALK
                      </Button>
                    }
                    defaultTab="signup"
                  />
                </div>
              )}
              
              {messages.length === 0 && user && (
                <div className="text-center py-8">
                  <Bot className="h-16 w-16 mx-auto text-medical/60 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Start a Medical Conversation</h3>
                  <p className="text-muted-foreground">
                    Ask me about symptoms, medications, or any health concerns you have.
                  </p>
                </div>
              )}

              {displayMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex items-start space-x-3 max-w-[80%] ${
                      message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-gradient-to-br from-medical to-healing text-white'
                    }`}>
                      {message.sender === 'user' ? 
                        <User className="h-4 w-4" /> : 
                        <Bot className="h-4 w-4" />
                      }
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted border border-border'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-2 opacity-70 ${
                        message.sender === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-medical to-healing text-white flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-muted border border-border">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-medical rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-medical rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-medical rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-sm text-muted-foreground">MEDITALK is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t bg-background">
              {user && (
                <div className="flex items-center space-x-4 mb-4 overflow-x-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-medical border-medical hover:bg-medical hover:text-white whitespace-nowrap"
                    onClick={() => handleQuickAction('dashboard')}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-medical border-medical hover:bg-medical hover:text-white whitespace-nowrap"
                    onClick={() => handleQuickAction('symptoms')}
                  >
                    Symptom Check
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-healing border-healing hover:bg-healing hover:text-white whitespace-nowrap"
                    onClick={() => handleQuickAction('medications')}
                  >
                    Medications
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary hover:bg-primary hover:text-white whitespace-nowrap"
                    onClick={() => handleQuickAction('image')}
                  >
                    Image Analysis
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emergency border-emergency hover:bg-emergency hover:text-white whitespace-nowrap"
                    onClick={() => handleQuickAction('emergency')}
                  >
                    Emergency
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground border-muted-foreground hover:bg-muted-foreground hover:text-white whitespace-nowrap"
                    onClick={() => handleQuickAction('profile')}
                  >
                    Profile
                  </Button>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder={user ? "Describe your symptoms or ask a health question..." : "Sign in to start chatting with MEDITALK..."}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-20 border-medical/20 focus:border-medical"
                    disabled={!user}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={!user}>
                      <Mic className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={!user}>
                      <Camera className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={handleSendMessage}
                  variant="medical"
                  size="sm"
                  className="px-6"
                  disabled={!user || !inputMessage.trim() || loading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Medical Disclaimer */}
              <div className="flex items-start space-x-2 mt-4 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-warning mb-1">Medical Disclaimer</p>
                  <p>
                    MEDITALK provides general health information for educational purposes only. 
                    This is not a substitute for professional medical advice, diagnosis, or treatment. 
                    Always consult qualified healthcare providers for medical concerns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default ChatInterface;