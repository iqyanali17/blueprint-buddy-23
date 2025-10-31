import { supabase } from '@/integrations/supabase/client';

export const useSupport = () => {
  const sendSupportMessage = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return { error: new Error('Message is empty') };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    const email = user.email || null;
    const username = (user.user_metadata as any)?.full_name || null;

    const { error } = await (supabase as any).from('support_messages').insert({
      user_id: user.id,
      email,
      username,
      message: trimmed,
    });

    return { error: error || null };
  };

  return { sendSupportMessage };
};
