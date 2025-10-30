import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Msg {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  sender: 'user' | 'assistant';
  message_type: string;
  created_at: string;
  metadata: any;
}

const DoctorInbox: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const isDoctor = (user?.user_metadata as any)?.account_type === 'doctor';

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error && data) setMessages(data as any);
    };
    load();
  }, [user]);

  const sessions = useMemo(() => {
    const map = new Map<string, Msg[]>();
    for (const m of messages) {
      if (!map.has(m.session_id)) map.set(m.session_id, []);
      map.get(m.session_id)!.push(m);
    }
    return Array.from(map.entries())
      .map(([sid, msgs]) => ({ sid, msgs: msgs.sort((a,b)=>a.created_at.localeCompare(b.created_at)) }))
      .sort((a,b)=> b.msgs[b.msgs.length-1].created_at.localeCompare(a.msgs[a.msgs.length-1].created_at));
  }, [messages]);

  const current = sessions.find(s => s.sid === selectedSession) || sessions[0];

  const sendReply = async () => {
    if (!user || !current) return;
    const content = reply.trim();
    if (!content) return;
    const { data, error } = await supabase
      .from('messages')
      .insert({
        session_id: current.sid,
        user_id: user.id,
        content,
        message_type: 'text',
        sender: 'assistant',
      })
      .select()
      .single();
    if (!error && data) {
      setMessages(prev => [...prev, data as any]);
      setReply('');
    }
  };

  if (!user || !isDoctor) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto p-8">
            <p className="text-center text-muted-foreground">Access restricted.</p>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Badge variant="outline" className="border-healing text-healing">Doctor Inbox</Badge>
          <h2 className="text-3xl font-bold mt-2">Messages from Patients</h2>
        </div>
        <Card className="max-w-6xl mx-auto grid md:grid-cols-3">
          <div className="border-r p-4 space-y-2 max-h-[520px] overflow-y-auto">
            {sessions.map(s => {
              const last = s.msgs[s.msgs.length-1];
              const flagged = s.msgs.some(m => m.metadata && m.metadata.help_qna);
              return (
                <button
                  key={s.sid}
                  onClick={() => setSelectedSession(s.sid)}
                  className={`w-full text-left rounded-lg p-3 border ${current?.sid===s.sid?'bg-muted':''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Session {s.sid.slice(0,6)}…</span>
                    {flagged && <span className="text-xs px-2 py-0.5 rounded bg-warning/20 text-warning border">Help Q&A</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{last?.content}</p>
                </button>
              );
            })}
          </div>
          <div className="md:col-span-2 p-4 flex flex-col h-[560px]">
            <div className="flex-1 overflow-y-auto space-y-3">
              {current?.msgs.map(m => (
                <div key={m.id} className={`flex ${m.sender==='assistant'?'justify-end':'justify-start'}`}>
                  <div className={`px-3 py-2 rounded-xl text-sm ${m.sender==='assistant'?'bg-primary text-primary-foreground':'bg-muted border'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input value={reply} onChange={(e)=>setReply(e.target.value)} placeholder="Type your reply…" />
              <Button onClick={sendReply} disabled={!reply.trim()}>Send</Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default DoctorInbox;
