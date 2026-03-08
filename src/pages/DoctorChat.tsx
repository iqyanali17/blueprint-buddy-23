import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Stethoscope, Send, Plus, ArrowLeft, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DoctorChatRow {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  status: string;
  created_at: string;
}

interface ChatMsg {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  created_at: string;
}

const DoctorChat: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const accountType = (user?.user_metadata as any)?.account_type;
  const isDoctor = accountType === 'doctor';

  const [chats, setChats] = useState<DoctorChatRow[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [reply, setReply] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) loadChats();
  }, [user]);

  useEffect(() => {
    if (selectedChat) loadMessages(selectedChat);
  }, [selectedChat]);

  // Realtime
  useEffect(() => {
    if (!selectedChat) return;
    const channel = supabase
      .channel(`doctor-chat-${selectedChat}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'doctor_chat_messages',
        filter: `chat_id=eq.${selectedChat}`,
      } as any, (payload: any) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedChat]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    const { data } = await (supabase as any)
      .from('doctor_chats').select('*').order('updated_at', { ascending: false });
    if (data) setChats(data);
  };

  const loadMessages = async (chatId: string) => {
    const { data } = await (supabase as any)
      .from('doctor_chat_messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  // Patient: create new chat request
  const createChat = async () => {
    if (!user || !newMessage.trim()) return;
    setCreating(true);
    try {
      const { data: chat, error } = await (supabase as any)
        .from('doctor_chats')
        .insert({ patient_id: user.id })
        .select()
        .single();
      if (error) throw error;

      await (supabase as any).from('doctor_chat_messages').insert({
        chat_id: chat.id,
        sender_id: user.id,
        sender_type: 'patient',
        content: newMessage.trim(),
      });

      setChats(prev => [chat, ...prev]);
      setSelectedChat(chat.id);
      setNewMessage('');
      setShowNew(false);
      toast({ title: 'Chat Started', description: 'Waiting for a doctor to respond.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setCreating(false); }
  };

  // Doctor: accept a waiting chat
  const acceptChat = async (chatId: string) => {
    if (!user) return;
    const { error } = await (supabase as any)
      .from('doctor_chats')
      .update({ doctor_id: user.id, status: 'active' })
      .eq('id', chatId);
    if (!error) {
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, doctor_id: user.id, status: 'active' } : c));
      toast({ title: 'Chat Accepted' });
    }
  };

  const sendReply = async () => {
    if (!user || !selectedChat || !reply.trim()) return;
    const { error } = await (supabase as any).from('doctor_chat_messages').insert({
      chat_id: selectedChat,
      sender_id: user.id,
      sender_type: isDoctor ? 'doctor' : 'patient',
      content: reply.trim(),
    });
    if (!error) setReply('');
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;

  const current = chats.find(c => c.id === selectedChat);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{isDoctor ? 'Patient Chats' : 'Chat with Doctor'}</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1" />Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 min-h-[500px]">
            {/* Chat list */}
            <div className="border-r p-4 space-y-2">
              {!isDoctor && (
                <Button size="sm" className="w-full mb-3" onClick={() => setShowNew(true)}>
                  <Plus className="h-4 w-4 mr-1" />New Consultation
                </Button>
              )}
              {chats.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No chats yet</p>}
              {chats.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedChat(c.id); setShowNew(false); }}
                  className={`w-full text-left rounded-lg p-3 border transition-colors ${selectedChat === c.id ? 'bg-muted border-primary/30' : 'hover:bg-muted/50'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Chat #{c.id.slice(0, 6)}</span>
                    <Badge
                      variant={c.status === 'active' ? 'default' : c.status === 'waiting' ? 'outline' : 'secondary'}
                      className="text-[10px]"
                    >
                      {c.status === 'waiting' && <Clock className="h-3 w-3 mr-0.5" />}
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(c.created_at).toLocaleDateString()}</p>
                </button>
              ))}
            </div>

            {/* Chat area */}
            <div className="md:col-span-2 p-4 flex flex-col">
              {showNew && !isDoctor ? (
                <div className="space-y-4">
                  <h3 className="font-semibold">Start a consultation with a doctor</h3>
                  <Textarea
                    placeholder="Describe your health concern..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={createChat} disabled={creating || !newMessage.trim()}>
                      <Send className="h-4 w-4 mr-1" />{creating ? 'Sending...' : 'Start Chat'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
                  </div>
                </div>
              ) : current ? (
                <>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b">
                    <div>
                      <h3 className="font-semibold">Chat #{current.id.slice(0, 8)}</h3>
                      <p className="text-xs text-muted-foreground">
                        {current.status === 'waiting' ? 'Waiting for a doctor...' : current.status === 'active' ? 'In progress' : 'Closed'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDoctor && current.status === 'waiting' && (
                        <Button size="sm" onClick={() => acceptChat(current.id)}>Accept Chat</Button>
                      )}
                      <Badge variant={current.status === 'active' ? 'default' : 'secondary'}>{current.status}</Badge>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 max-h-[380px]">
                    {messages.map(m => {
                      const isMe = m.sender_id === user?.id;
                      return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted border'}`}>
                            {!isMe && <p className="text-[10px] font-bold mb-0.5 opacity-80">{m.sender_type === 'doctor' ? 'Doctor' : 'Patient'}</p>}
                            {m.content}
                            <p className="text-[9px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEnd} />
                  </div>
                  {(current.status === 'active' || (current.status === 'waiting' && !isDoctor)) && (
                    <div className="mt-3 flex items-center gap-2">
                      <Input
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        placeholder="Type your message..."
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                      />
                      <Button onClick={sendReply} disabled={!reply.trim()} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  {isDoctor ? 'Select a chat to respond' : 'Select a chat or start a new consultation'}
                </div>
              )}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default DoctorChat;
