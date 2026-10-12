import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Plus, Menu, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { AuthModal } from '@/components/auth/AuthModal';
import { LanguageSelector } from '@/components/LanguageSelector';
import { toast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ChatInputBar, QuickActionType } from './ChatInputBar';
import { optimizeImage } from '@/lib/imageOptimizer';

const SymptomChecker = lazy(() => import('./SymptomChecker'));
const MedicationTracker = lazy(() => import('./MedicationTracker'));
const EmergencyGuide = lazy(() => import('./EmergencyGuide'));
const ImageAnalysis = lazy(() => import('./ImageAnalysis'));
const HealthDashboard = lazy(() => import('./HealthDashboard'));
const UserProfile = lazy(() => import('./UserProfile'));

const ChatInterface = () => {
  const { user } = useAuth();
  const {
    messages,
    currentSession,
    sessions,
    loading,
    createSession,
    sendMessage,
    addAssistantMessage,
    setCurrentSession,
    loadMessages,
    deleteSession,
  } = useChat();

  const [currentView, setCurrentView] = useState<'chat' | 'symptoms' | 'medications' | 'emergency' | 'image' | 'dashboard' | 'profile'>('chat');
  const [, setSelectedLanguage] = useState('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep position; do not auto-scroll when switching views
  useEffect(() => {
    // intentionally empty to avoid hook order changes and keep behavior consistent
  }, [currentView]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start chatting with MEDITALK.",
        variant: "destructive",
      });
      return;
    }

    let sessionId = currentSession?.id;
    if (!sessionId) {
      const s = await createSession('Medical Consultation');
      sessionId = s?.id;
    }

    await sendMessage(text, { sessionIdOverride: sessionId });
  }, [user, currentSession?.id, createSession, sendMessage]);

  const handleSendImage = useCallback(async (file: File, caption: string) => {
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) return;

    try {
      const { dataUrl, size } = await optimizeImage(file, 1280, 0.82);
      let sessionId = currentSession?.id;
      if (!sessionId) {
        const s = await createSession('Medical Consultation');
        sessionId = s?.id;
      }
      await sendMessage(caption.trim(), {
        messageType: 'image',
        attachments: [dataUrl],
        metadata: { name: file.name, size, type: 'image/webp' },
        sessionIdOverride: sessionId,
      });
    } catch (err) {
      console.error('Error processing image:', err);
      toast({
        title: "Image processing failed",
        description: "Unable to process the image. Please try again.",
        variant: "destructive",
      });
    }
  }, [user, currentSession?.id, createSession, sendMessage]);

  const handleStartNewChat = async () => {
    if (!user) return;
    await createSession('New Consultation');
    setCurrentView('chat');
  };

  const handleQuickAction = useCallback((type: QuickActionType) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access this feature.",
        variant: "destructive",
      });
      return;
    }
    setCurrentView(type);
  }, [user]);

  const handleSymptomComplete = async (assessment: string) => {
    let sessionId = currentSession?.id;
    if (!sessionId) {
      const s = await createSession('Symptom Assessment');
      sessionId = s?.id;
    }
    await sendMessage(assessment, { sessionIdOverride: sessionId });
    setCurrentView('chat');
  };

  const handleImageComplete = async (payload: { imageDataUrl: string; result: string }) => {
    let sessionId = currentSession?.id;
    if (!sessionId) {
      const s = await createSession('Image Analysis');
      sessionId = s?.id;
    }
    // 1) Send the image as user's message without triggering AI
    await sendMessage('', {
      messageType: 'image',
      attachments: payload.imageDataUrl ? [payload.imageDataUrl] : [],
      metadata: { source: 'image-analysis' },
      skipAI: true,
      sessionIdOverride: sessionId,
    });
    // 2) Append the analysis as assistant reply
    await addAssistantMessage(payload.result, 'text');
    // 3) Go back to chat view
    setCurrentView('chat');
  };

  // Demo messages for non-authenticated users
  const demoMessages = [
    {
      id: '1',
      sender: 'assistant',
      content: "Hello! I'm MEDITALK, your AI healthcare assistant. I can help you with symptom assessment, medical guidance, and health questions. How can I assist you today?",
      created_at: new Date().toISOString(),
      message_type: 'text',
      attachments: [],
      metadata: null,
      session_id: 'demo',
      user_id: 'demo',
    },
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
          <Suspense fallback={<div className="flex justify-center p-12"><LoadingSpinner size="lg" text="Loading Symptom Checker..." /></div>}>
            <SymptomChecker onComplete={handleSymptomComplete} />
          </Suspense>
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
          <Suspense fallback={<div className="flex justify-center p-12"><LoadingSpinner size="lg" text="Loading Medication Tracker..." /></div>}>
            <MedicationTracker />
          </Suspense>
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
          <Suspense fallback={<div className="flex justify-center p-12"><LoadingSpinner size="lg" text="Loading Emergency Guide..." /></div>}>
            <EmergencyGuide />
          </Suspense>
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
          <Suspense fallback={<div className="flex justify-center p-12"><LoadingSpinner size="lg" text="Loading Image Analysis..." /></div>}>
            <ImageAnalysis onComplete={handleImageComplete} />
          </Suspense>
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
          <Suspense fallback={<div className="flex justify-center p-12"><LoadingSpinner size="lg" text="Loading Health Dashboard..." /></div>}>
            <HealthDashboard />
          </Suspense>
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
          <Suspense fallback={<div className="flex justify-center p-12"><LoadingSpinner size="lg" text="Loading Profile..." /></div>}>
            <UserProfile />
          </Suspense>
        </div>
      </section>
    );
  }

  return (
    <section id="chat" className="py-0 min-h-screen bg-muted/30">
      <div className="mx-auto px-0">
        <Card className="w-full max-w-none rounded-none shadow-2xl border-0 bg-background">
          <div className="flex flex-col h-[100dvh] md:h-[100vh]">
            {/* Chat Header */}
            <div className="p-3 sm:p-6 border-b bg-gradient-to-r from-medical/5 to-healing/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="px-2 sm:px-3">
                        <Menu className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">History</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[280px] sm:w-80 sm:max-w-sm">
                      <SheetHeader>
                        <SheetTitle>Chat History</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleStartNewChat}
                          className="w-full border-medical text-medical hover:bg-medical hover:text-white"
                        >
                          <Plus className="h-4 w-4 mr-1" /> New Chat
                        </Button>
                      </div>
                      <div className="mt-3 flex-1 overflow-y-auto">
                        {sessions.map((s) => (
                          <div
                            key={s.id}
                            onClick={async () => {
                              setCurrentSession(s);
                              await loadMessages(s.id);
                            }}
                            className={`group px-3 py-2 cursor-pointer hover:bg-muted/50 rounded-md flex items-center justify-between ${
                              currentSession?.id === s.id ? 'bg-muted' : ''
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{s.title || 'Untitled Chat'}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(s.updated_at).toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await deleteSession(s.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                              aria-label="Delete chat"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {sessions.length === 0 && (
                          <p className="text-sm text-muted-foreground mt-6 text-center">No chats yet</p>
                        )}
                      </div>
                      <div className="mt-4 text-xs text-muted-foreground text-center">© 2025 MediTalk</div>
                    </SheetContent>
                  </Sheet>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-medical to-healing flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-lg truncate">MEDITALK Assistant</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {user ? `Hello, ${user.user_metadata?.full_name || 'there'}` : 'Demo Mode'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {user && (
                    <>
                      <LanguageSelector onLanguageChange={setSelectedLanguage} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartNewChat}
                        className="border-medical text-medical hover:bg-medical hover:text-white text-xs sm:text-sm"
                      >
                        <Plus className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">New Chat</span>
                      </Button>
                    </>
                  )}
                  <Badge variant="secondary" className="bg-healing/10 text-healing border-healing/20 text-xs">
                    AI Powered
                  </Badge>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 scroll-smooth">
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
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start space-x-3 max-w-[85%] md:max-w-[75%] ${
                      message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gradient-to-br from-medical to-healing text-white'
                      }`}
                    >
                      {message.sender === 'user' ? (
                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted border border-border'
                      }`}
                    >
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mb-2 space-y-2">
                          {message.attachments.map((att, idx) => (
                            <img
                              key={idx}
                              src={att}
                              alt="Attachment"
                              className="max-h-60 rounded-lg border object-cover"
                            />
                          ))}
                        </div>
                      )}
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <span className="text-[10px] opacity-70 mt-1 block">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
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
            <ChatInputBar
              user={user}
              loading={loading}
              onSendMessage={handleSendMessage}
              onSendImage={handleSendImage}
              onQuickAction={handleQuickAction}
            />
          </div>
        </Card>
      </div>
    </section>
  );
};

export default ChatInterface;