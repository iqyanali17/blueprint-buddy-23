import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Plus, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  created_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  created_at: string;
}

const SupportChat: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    loadTickets();
  }, [user]);

  useEffect(() => {
    if (selectedTicket) loadMessages(selectedTicket);
  }, [selectedTicket]);

  // Realtime messages
  useEffect(() => {
    if (!selectedTicket) return;
    const channel = supabase
      .channel(`support-msgs-${selectedTicket}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_ticket_messages',
        filter: `ticket_id=eq.${selectedTicket}`,
      } as any, (payload: any) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadTickets = async () => {
    const { data } = await (supabase as any)
      .from('support_tickets').select('*').order('updated_at', { ascending: false });
    if (data) setTickets(data);
  };

  const loadMessages = async (ticketId: string) => {
    const { data } = await (supabase as any)
      .from('support_ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const createTicket = async () => {
    if (!user || !newMessage.trim()) return;
    setCreating(true);
    try {
      const { data: ticket, error } = await (supabase as any)
        .from('support_tickets')
        .insert({
          user_id: user.id,
          email: user.email,
          username: user.user_metadata?.full_name || null,
          subject: newSubject.trim() || 'General Query',
        })
        .select()
        .single();
      if (error) throw error;

      await (supabase as any).from('support_ticket_messages').insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        sender_type: 'user',
        content: newMessage.trim(),
      });

      setTickets(prev => [ticket, ...prev]);
      setSelectedTicket(ticket.id);
      setNewSubject('');
      setNewMessage('');
      setShowNew(false);
      toast({ title: 'Ticket Created', description: 'Your message has been sent to the admin.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setCreating(false); }
  };

  const sendReply = async () => {
    if (!user || !selectedTicket || !reply.trim()) return;
    const { error } = await (supabase as any).from('support_ticket_messages').insert({
      ticket_id: selectedTicket,
      sender_id: user.id,
      sender_type: 'user',
      content: reply.trim(),
    });
    if (!error) setReply('');
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;

  const current = tickets.find(t => t.id === selectedTicket);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Contact Admin</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-1" />Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 min-h-[500px]">
            {/* Ticket list */}
            <div className="border-r p-4 space-y-2">
              <Button size="sm" className="w-full mb-3" onClick={() => setShowNew(true)}>
                <Plus className="h-4 w-4 mr-1" />New Message
              </Button>
              {tickets.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No conversations yet</p>}
              {tickets.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTicket(t.id); setShowNew(false); }}
                  className={`w-full text-left rounded-lg p-3 border transition-colors ${selectedTicket === t.id ? 'bg-muted border-primary/30' : 'hover:bg-muted/50'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate">{t.subject}</span>
                    <Badge variant={t.status === 'open' ? 'default' : 'secondary'} className="text-[10px] ml-1">{t.status}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(t.created_at).toLocaleDateString()}</p>
                </button>
              ))}
            </div>

            {/* Chat / New ticket area */}
            <div className="md:col-span-2 p-4 flex flex-col">
              {showNew ? (
                <div className="space-y-4">
                  <h3 className="font-semibold">Send a message to Admin</h3>
                  <Input
                    placeholder="Subject (optional)"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                  />
                  <Textarea
                    placeholder="Describe your question or issue..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={createTicket} disabled={creating || !newMessage.trim()}>
                      <Send className="h-4 w-4 mr-1" />{creating ? 'Sending...' : 'Send'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
                  </div>
                </div>
              ) : current ? (
                <>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b">
                    <div>
                      <h3 className="font-semibold">{current.subject}</h3>
                      <p className="text-xs text-muted-foreground">Ticket #{current.id.slice(0, 8)}</p>
                    </div>
                    <Badge variant={current.status === 'open' ? 'default' : 'secondary'}>{current.status}</Badge>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 max-h-[380px]">
                    {messages.map(m => (
                      <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.sender_type === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted border'}`}>
                          {m.sender_type === 'admin' && <p className="text-[10px] font-bold mb-0.5 opacity-80">Admin</p>}
                          {m.content}
                          <p className="text-[9px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEnd} />
                  </div>
                  {current.status === 'open' && (
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
                  Select a conversation or start a new one
                </div>
              )}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default SupportChat;
