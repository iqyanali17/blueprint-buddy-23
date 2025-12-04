import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type AccountType = 'patient' | 'doctor' | 'admin';

// Helper to check if error indicates table doesn't exist
const isTableNotFoundError = (error: any): boolean => {
  if (!error) return false;
  const msg = String(error?.message || error?.code || '').toLowerCase();
  return msg.includes('does not exist') || 
         msg.includes('not found') || 
         msg.includes('could not find') ||
         msg.includes('pgrst205') ||
         msg.includes('404');
};

export const useAuth = (enablePresence = false, checkInitialAuth = false) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!checkInitialAuth);
  const [initialized, setInitialized] = useState(!checkInitialAuth);
  
  // Disable presence by default since tables don't exist
  const presenceChecked = useRef(false);
  const [presenceAvailable, setPresenceAvailable] = useState(false);

  // Check user on mount and auth changes
  useEffect(() => {
    if (!checkInitialAuth) {
      setLoading(false);
      return;
    }

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (err) {
        console.warn('Error getting session:', err);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
  }, [checkInitialAuth]);

  // Optional presence heartbeat - only if tables exist and enabled
  useEffect(() => {
    if (!user || !enablePresence || presenceChecked.current) return;
    
    // Check once if presence table exists
    const checkPresence = async () => {
      try {
        const { error } = await (supabase as any).from('user_presence').select('user_id').limit(1);
        if (error && isTableNotFoundError(error)) {
          setPresenceAvailable(false);
        } else if (!error) {
          setPresenceAvailable(true);
        }
      } catch {
        setPresenceAvailable(false);
      }
      presenceChecked.current = true;
    };
    
    checkPresence();
  }, [user, enablePresence]);

  const signUp = async (email: string, password: string, fullName: string, accountType: AccountType = 'patient') => {
    try {
      setLoading(true);
      const { error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, account_type: accountType },
          emailRedirectTo: `${window.location.origin}/`,
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
      
      // Verify environment variables are set
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
        throw new Error('Authentication service is not properly configured');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
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
          await supabase.auth.signOut();
          throw new Error('Admin access denied. Your account is not an Admin.');
        }
      }

      // Store/refresh selected account type in user metadata
      if (accountType && userId) {
        await supabase.auth.updateUser({
          data: { account_type: accountType },
        }).catch(() => {});
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
