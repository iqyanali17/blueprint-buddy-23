import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type AccountType = 'patient' | 'doctor' | 'admin';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

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

  const signUp = async (email: string, password: string, fullName: string, accountType: AccountType = 'patient') => {
    try {
      setLoading(true);
      // Step 1: send OTP via Edge Function (only for new account creation)
      const { data, error } = await supabase.functions.invoke('signup-otp', {
        body: {
          action: 'send',
          email,
          fullName,
          accountType,
        },
      });

      if (error) throw error;

      const devCode = (data as any)?.dev_code as string | undefined;
      const description = devCode
        ? `Dev mode: use code ${devCode} (expires in 5 minutes).`
        : "We sent a 6-digit code to your email. Enter it to complete signup.";

      toast({
        title: "Verify your email",
        description,
      });

      return { data: { sent: true, dev_code: devCode }, error: null };
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

  const verifySignUp = async (email: string, code: string, password: string, fullName: string, accountType: AccountType = 'patient') => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('signup-otp', {
        body: {
          action: 'verify',
          email,
          code,
          password,
          fullName,
          accountType,
        },
      });
      if (error) throw error;

      // Auto sign-in after successful verification and account creation
      const signInResult = await supabase.auth.signInWithPassword({ email, password });
      if (signInResult.error) throw signInResult.error;
      return { data: signInResult.data, error: null };
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string, accountType?: AccountType) => {
    try {
      setLoading(true);
      console.log('Attempting sign in with:', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign in result:', { data, error });
      if (error) throw error;
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