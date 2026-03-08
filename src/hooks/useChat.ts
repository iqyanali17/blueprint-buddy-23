import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ChatSession, Message } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export const useChat = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Load chat sessions
  const loadSessions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      console.error('Error loading sessions:', error.message);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);
      if (error) throw error;
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        const next = sessions.find(s => s.id !== sessionId) || null;
        setCurrentSession(next || null);
        setMessages([]);
        if (next) await loadMessages(next.id);
      }
      return true;
    } catch (error: any) {
      console.error('Error deleting session:', error.message);
      toast({ title: 'Error deleting session', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  // Directly add an assistant message (used for deterministic frontend modules)
  const addAssistantMessage = async (content: string, messageType: Message['message_type'] = 'text') => {
    if (!user || !currentSession) return null;
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          session_id: currentSession.id,
          user_id: user.id,
          content,
          message_type: messageType,
          sender: 'assistant',
        })
        .select()
        .single();
      if (error) throw error;
      setMessages(prev => [...prev, data]);
      return data;
    } catch (error: any) {
      console.error('Error adding assistant message:', error.message);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  };

  // Load messages for current session
  const loadMessages = async (sessionId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error loading messages:', error.message);
    }
  };

  // Create new chat session
  const createSession = async (title: string = 'New Conversation', type: ChatSession['session_type'] = 'general') => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title,
          session_type: type,
        })
        .select()
        .single();

      if (error) throw error;
      
      setSessions(prev => [data, ...prev]);
      setCurrentSession(data);
      setMessages([]);
      
      return data;
    } catch (error: any) {
      console.error('Error creating session:', error.message);
      toast({
        title: "Error creating chat session",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Send message
  type SendOptions = {
    messageType?: Message['message_type'];
    attachments?: string[];
    metadata?: any;
    skipAI?: boolean;
    sessionIdOverride?: string;
  };

  const sendMessage = async (content: string, options: SendOptions = {}) => {
    if (!user) return null;
    const { messageType = 'text', attachments, metadata, skipAI = false, sessionIdOverride } = options;
    const sessionId = sessionIdOverride ?? currentSession?.id;
    if (!sessionId) return null;
    
    try {
      // Insert user message
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          content,
          message_type: messageType,
          attachments: attachments ?? null,
          metadata: metadata ?? null,
          sender: 'user',
        })
        .select()
        .single();

      if (userError) throw userError;
      
      setMessages(prev => [...prev, userMessage]);

      // Optionally generate AI response
      let assistantMessage: Message | null = null;
      if (!skipAI) {
        const aiResponse = await generateAIResponse(content);
        const { data, error: assistantError } = await supabase
          .from('messages')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            content: aiResponse,
            message_type: 'text',
            sender: 'assistant',
          })
          .select()
          .single();

        if (assistantError) throw assistantError;
        assistantMessage = data as Message;
        setMessages(prev => [...prev, assistantMessage]);
      }
      
      return assistantMessage;
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Call AI for actual medical assistance
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    setLoading(true);
    
    try {
      // Fetch user profile for personalized context
      let profileContext = '';
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, date_of_birth, medical_conditions, allergies, medications, emergency_contact')
          .eq('id', user.id)
          .single();

        if (profile) {
          const parts: string[] = [];
          if (profile.full_name) parts.push(`Name: ${profile.full_name}`);
          if (profile.date_of_birth) {
            const age = Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / 31557600000);
            parts.push(`Age: ${age} years`);
          }
          if (profile.medical_conditions?.length) parts.push(`Known conditions: ${profile.medical_conditions.join(', ')}`);
          if (profile.allergies?.length) parts.push(`Allergies: ${profile.allergies.join(', ')}`);
          if (profile.medications?.length) parts.push(`Current medications: ${profile.medications.join(', ')}`);
          if (parts.length > 0) {
            profileContext = `\n\n--- PATIENT PROFILE (use this to personalize your response, warn about drug interactions/allergy conflicts) ---\n${parts.join('\n')}\n---`;
          }
        }
      }

      // Build conversation with a strict system instruction to enforce point-wise format
      const systemInstruction = `You are MediTalk AI, a warm and caring multi-user smart medical assistant. Detect the user's language and ALWAYS respond in that same language.

IMPORTANT RULES:
- Respond in the SAME LANGUAGE the user writes in (Hindi → Hindi, Urdu → Urdu, English → English, etc.)
- Write simply and clearly — like a kind doctor talking to a friend
- Use everyday words, avoid complex medical jargon
- Give practical, step-by-step advice
- Keep each section to 3-5 concise lines max
- Be warm, personal, and caring

MEMORY: You have full conversation history. Remember everything the user has told you — their name, allergies, conditions, preferences. If they say "remember this", acknowledge and use it later. Always reference their profile and past messages for personalized advice.

When user is a Patient (friendly, simple, actionable):
1. What's happening: (explain their concern simply)
2. What to do: (clear steps)
3. Medicine (if needed): (name, dose, when to take, warnings)
4. Important tips:
5. When to see a doctor:

When user is a Doctor (technical, professional):
1. Assessment:
2. Differential diagnosis:
3. Recommended treatment:
4. Monitoring:
5. Escalation criteria:

When user is an Admin (supervisory):
1. Check:
2. Action:
3. Forward:
4. Logs:
5. Guidance:

SAFETY: If allergies or medications are known, ALWAYS check for conflicts. For emergencies, clearly say "Go to the hospital immediately." Address user by name when available.${profileContext}`;


      const conversationMessages = [
        { role: 'system', content: systemInstruction },
        ...messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const { data, error } = await supabase.functions.invoke('medical-chat', {
        body: { messages: conversationMessages }
      });

      if (error) {
        console.error('Error calling AI:', error);
        throw error;
      }

      setLoading(false);
      return data.message || "I apologize, but I couldn't generate a response. Please try again.";
    } catch (error: any) {
      setLoading(false);
      console.error('AI error:', error);
      toast({
        title: "AI Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
      return "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.";
    }
  };

  useEffect(() => {
    if (user) {
      loadSessions();
    } else {
      setSessions([]);
      setCurrentSession(null);
      setMessages([]);
    }
  }, [user]);

  return {
    sessions,
    currentSession,
    messages,
    loading,
    loadSessions,
    loadMessages,
    createSession,
    sendMessage,
    addAssistantMessage,
    setCurrentSession,
    deleteSession,
  };
};