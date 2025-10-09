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
  const sendMessage = async (content: string, messageType: Message['message_type'] = 'text') => {
    if (!user || !currentSession) return null;
    
    try {
      // Insert user message
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert({
          session_id: currentSession.id,
          user_id: user.id,
          content,
          message_type: messageType,
          sender: 'user',
        })
        .select()
        .single();

      if (userError) throw userError;
      
      setMessages(prev => [...prev, userMessage]);

      // Simulate AI response (in production, this would call your AI service)
      const aiResponse = await generateAIResponse(content);
      
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('messages')
        .insert({
          session_id: currentSession.id,
          user_id: user.id,
          content: aiResponse,
          message_type: 'text',
          sender: 'assistant',
        })
        .select()
        .single();

      if (assistantError) throw assistantError;
      
      setMessages(prev => [...prev, assistantMessage]);
      
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
      // Build conversation history for context
      const conversationMessages = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Add the new user message
      conversationMessages.push({
        role: 'user',
        content: userMessage
      });

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
    setCurrentSession,
  };
};