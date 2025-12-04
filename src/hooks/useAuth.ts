import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type AccountType = 'patient' | 'doctor' | 'admin';

export const useAuth = (enablePresence = true, checkInitialAuth = false) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!checkInitialAuth);
  const [initialized, setInitialized] = useState(!checkInitialAuth);
  const [presenceAvailable, setPresenceAvailable] = useState(enablePresence);

  // Check user on mount and auth changes
  useEffect(() => {
    if (!checkInitialAuth) {
      setLoading(false);
      return;
    }

    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setInitialized(true);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setInitialized(true);

        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome to MEDITALK!",
            description: "You've successfully signed in to your medical assistant.",
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You've been safely signed out of MEDITALK.",
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Presence heartbeat for live users (separate top-level effect)
  useEffect(() => {
    let interval: any;
    if (!user || !presenceAvailable || !enablePresence) return;
    const emailVal = user.email;
    const usernameVal = (user.user_metadata as any)?.full_name || null;
    (async () => {
      try {
        const { error } = await (supabase as any).from('user_presence').upsert({
          user_id: user.id,
          email: emailVal,
          username: usernameVal,
          is_online: true,
          last_seen: new Date().toISOString(),
        });
        if (error) {
          const msg = String(error?.message || '').toLowerCase();
          if (msg.includes('does not exist') || msg.includes('not found') || msg.includes('404')) {
            setPresenceAvailable(false);
            return;
          }
        }
      } catch (e: any) {
        const msg = String(e?.message || '').toLowerCase();
        if (msg.includes('does not exist') || msg.includes('not found') || msg.includes('404')) {
          setPresenceAvailable(false);
          return;
        }
      }
    })();

    interval = setInterval(async () => {
      if (!presenceAvailable) return;
      try {
        const { error } = await (supabase as any).from('user_presence').upsert({
          user_id: user.id,
          email: emailVal,
          username: usernameVal,
          is_online: true,
          last_seen: new Date().toISOString(),
        });
        if (error) {
          const msg = String(error?.message || '').toLowerCase();
          if (msg.includes('does not exist') || msg.includes('not found') || msg.includes('404')) {
            setPresenceAvailable(false);
            clearInterval(interval);
          }
        }
      } catch (e: any) {
        const msg = String(e?.message || '').toLowerCase();
        if (msg.includes('does not exist') || msg.includes('not found') || msg.includes('404')) {
          setPresenceAvailable(false);
          clearInterval(interval);
        }
      }
    }, 30000);

    const onUnload = async () => {
      try {
        if (!presenceAvailable) return;
        await (supabase as any).from('user_presence').upsert({
          user_id: user.id,
          email: emailVal,
          username: usernameVal,
          is_online: false,
          last_seen: new Date().toISOString(),
        });
      } catch {}
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('beforeunload', onUnload);
      // best-effort set offline on unmount
      if (presenceAvailable && enablePresence) {
        (supabase as any).from('user_presence').upsert({
          user_id: user.id,
          email: user.email,
          username: (user.user_metadata as any)?.full_name || null,
          is_online: false,
          last_seen: new Date().toISOString(),
        });
      }
    };
  }, [user, presenceAvailable, enablePresence]);

  const signUp = async (email: string, password: string, fullName: string, accountType: AccountType = 'patient') => {
    try {
      setLoading(true);
      // Create account directly with anon key; requires email confirmations disabled for immediate session
      const { error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, account_type: accountType },
          // If email confirmations are disabled in Supabase Auth, user will be confirmed immediately
        },
      });
      if (signUpErr) throw signUpErr;

      // Sign in immediately
      const signInResult = await supabase.auth.signInWithPassword({ email, password });
      if (signInResult.error) throw signInResult.error;

      toast({
        title: 'Account created',
        description: 'Your MEDITALK account is ready and you are signed in.',
      });
      return { data: signInResult.data, error: null };
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const verifySignUp = async () => {
    return { data: null, error: new Error('Verification disabled') };
  };

  const signIn = async (email: string, password: string, accountType?: AccountType) => {
    try {
      setLoading(true);
      console.log('🔑 Attempting sign in with:', { email, accountType });
      
      // Verify environment variables are set
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
        console.error('❌ Missing Supabase environment variables');
        throw new Error('Authentication service is not properly configured');
      }

      console.log('🔌 Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '***' : 'NOT SET');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔍 Sign in result:', { 
        user: data.user ? { id: data.user.id, email: data.user.email } : null, 
        session: !!data.session,
        error: error ? error.message : null 
      });

      if (error) {
        console.error('❌ Sign in error:', {
          message: error.message,
          name: error.name,
          status: (error as any).status,
          code: (error as any).code
        });
        
        // More user-friendly error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email before signing in.';
        }
        
        throw new Error(errorMessage);
      }
      const userId = data.user?.id;

      // If user signs in as Admin, ensure they truly are admin
      if (accountType === 'admin' && userId) {
        const { data: roles, error: roleErr } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .limit(1);
        if (roleErr) throw roleErr;
        const isAdmin = roles && roles[0]?.role === 'admin';
        if (!isAdmin) {
          // Sign out immediately to prevent unauthorized admin access
          await supabase.auth.signOut();
          throw new Error('Admin access denied. Your account is not an Admin.');
        }
      }

      // Store/refresh selected account type in user metadata for app context
      if (accountType && userId) {
        const { error: metaErr } = await supabase.auth.updateUser({
          data: { account_type: accountType },
        });
        if (metaErr) console.warn('Failed to update account_type metadata:', metaErr.message);
      }

      // Log login activity and set presence online
      try {
        const emailVal = data.user?.email || email;
        const usernameVal = (data.user?.user_metadata as any)?.full_name || null;
        await (supabase as any).from('user_logs').insert({
          user_id: userId,
          email: emailVal,
          username: usernameVal,
          status: 'logged_in',
        });
        if (enablePresence && presenceAvailable) {
          await (supabase as any).from('user_presence').upsert({
            user_id: userId,
            email: emailVal,
            username: usernameVal,
            is_online: true,
            last_seen: new Date().toISOString(),
          });
        }
      } catch (logErr: any) {
        console.warn('Failed to write login logs/presence:', logErr?.message || logErr);
      }
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      // Capture current user before sign out
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Log logout and set presence offline
      try {
        if (currentUser?.id) {
          await (supabase as any).from('user_logs').insert({
            user_id: currentUser.id,
            email: currentUser.email,
            username: (currentUser.user_metadata as any)?.full_name || null,
            status: 'logged_out',
          });
          if (enablePresence && presenceAvailable) {
            await (supabase as any).from('user_presence').upsert({
              user_id: currentUser.id,
              email: currentUser.email,
              username: (currentUser.user_metadata as any)?.full_name || null,
              is_online: false,
              last_seen: new Date().toISOString(),
            });
          }
        }
      } catch (logErr: any) {
        console.warn('Failed to write logout logs/presence:', logErr?.message || logErr);
      }
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password reset sent",
        description: "Check your email for the password reset link.",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    verifySignUp,
    signIn,
    signOut,
    resetPassword,
  };
};