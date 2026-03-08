
-- Support tickets table for user-to-admin messaging
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT,
  username TEXT,
  subject TEXT NOT NULL DEFAULT 'General Query',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can create their own tickets
CREATE POLICY "Users can create own tickets" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update tickets (close, etc)
CREATE POLICY "Admins can update tickets" ON public.support_tickets
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Support ticket messages (conversation thread)
CREATE TABLE public.support_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users can insert messages on their own tickets
CREATE POLICY "Users can send messages on own tickets" ON public.support_ticket_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND (
      EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Users can view messages on their own tickets
CREATE POLICY "Users can view own ticket messages" ON public.support_ticket_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all ticket messages" ON public.support_ticket_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert messages (replies)
CREATE POLICY "Admins can reply to tickets" ON public.support_ticket_messages
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') AND sender_id = auth.uid()
  );

-- Doctor chat requests table
CREATE TABLE public.doctor_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, active, closed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_chats ENABLE ROW LEVEL SECURITY;

-- Patients can create chat requests
CREATE POLICY "Patients can create chats" ON public.doctor_chats
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);

-- Patients can view own chats
CREATE POLICY "Patients can view own chats" ON public.doctor_chats
  FOR SELECT TO authenticated USING (auth.uid() = patient_id);

-- Doctors can view chats assigned to them or waiting
CREATE POLICY "Doctors can view assigned chats" ON public.doctor_chats
  FOR SELECT TO authenticated USING (auth.uid() = doctor_id OR (doctor_id IS NULL AND status = 'waiting'));

-- Doctors can update (accept) chats
CREATE POLICY "Doctors can update chats" ON public.doctor_chats
  FOR UPDATE TO authenticated USING (auth.uid() = doctor_id OR (doctor_id IS NULL AND status = 'waiting'));

-- Doctor chat messages
CREATE TABLE public.doctor_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.doctor_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'patient', -- 'patient' or 'doctor'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_chat_messages ENABLE ROW LEVEL SECURITY;

-- Patients can view messages in their chats
CREATE POLICY "Patients can view own chat messages" ON public.doctor_chat_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.doctor_chats WHERE id = chat_id AND patient_id = auth.uid())
  );

-- Doctors can view messages in their chats
CREATE POLICY "Doctors can view chat messages" ON public.doctor_chat_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.doctor_chats WHERE id = chat_id AND doctor_id = auth.uid())
  );

-- Both can send messages in their chats
CREATE POLICY "Users can send chat messages" ON public.doctor_chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND (
      EXISTS (SELECT 1 FROM public.doctor_chats WHERE id = chat_id AND (patient_id = auth.uid() OR doctor_id = auth.uid()))
    )
  );

-- Enable realtime for support and doctor chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_chat_messages;
