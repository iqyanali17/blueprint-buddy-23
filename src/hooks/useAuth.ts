import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type AccountType = 'patient' | 'doctor' | 'admin';

const AUTH_TIMEOUT_MS = 15000;

const withTimeout = async <T,>(promise: PromiseLike<T>, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out. Please check your connection and try again.`));
    }, AUTH_TIMEOUT_MS);
  });

  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const mapAuthErrorMessage = (message: string) => {
  if (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('Load failed') ||
    message.includes('Network request failed')
  ) {
    return 'Network error. Please check your internet connection and try again.';
  }

  if (message.toLowerCase().includes('timed out')) {
    return 'Request timed out. Please try again in a moment.';
  }

  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }

  if (message.includes('User already registered')) {
    return 'This email is already registered. Please sign in instead.';
  }

  if (message.includes('Email not confirmed')) {
    return 'Please verify your email before signing in.';
  }

  return message;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Check user on mount and auth changes
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
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

    // THEN check for existing session
    withTimeout(supabase.auth.getSession(), 'Session check')
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((error: any) => {
        console.error('Session check failed:', error);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, accountType: AccountType = 'patient') => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      setLoading(true);

      const { data: signUpData, error: signUpErr } = await withTimeout(
        supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { full_name: fullName, account_type: accountType },
            emailRedirectTo: `${window.location.origin}/`,
          },
        }),
        'Sign up request'
      );

      if (signUpErr) throw signUpErr;

      // If signup already returned a valid session, we are done.
      if (signUpData?.session) {
        toast({
          title: 'Account created',
          description: 'Your MEDITALK account is ready and you are signed in.',
        });
        return { data: signUpData, error: null };
      }

      // Some environments need a short delay before password login works after sign-up.
      let lastSignInError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const signInResult = await withTimeout(
          supabase.auth.signInWithPassword({ email: normalizedEmail, password }),
          'Sign in request'
        );

        if (!signInResult.error) {
          toast({
            title: 'Account created',
            description: 'Your MEDITALK account is ready and you are signed in.',
          });
          return { data: signInResult.data, error: null };
        }

        lastSignInError = signInResult.error;
      }

      throw lastSignInError || new Error('Unable to sign in right now. Please try logging in again.');
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: mapAuthErrorMessage(error?.message || 'Unable to create account right now.'),
        variant: 'destructive',
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
    const normalizedEmail = email.trim().toLowerCase();

    try {
      setLoading(true);

      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        }),
        'Sign in request'
      );

      if (error) {
        throw new Error(mapAuthErrorMessage(error.message));
      }

      const userId = data.user?.id;

      // If user signs in as Admin, ensure they truly are admin
      if (accountType === 'admin' && userId) {
        const { data: roles, error: roleErr } = await withTimeout(
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .limit(1),
          'Admin role check'
        );

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
        title: 'Sign in failed',
        description: mapAuthErrorMessage(error?.message || 'Unable to sign in right now.'),
        variant: 'destructive',
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await withTimeout(supabase.auth.signOut(), 'Sign out request');
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Sign out failed',
        description: mapAuthErrorMessage(error?.message || 'Unable to sign out right now.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
        'Password reset request'
      );

      if (error) throw error;

      toast({
        title: 'Password reset sent',
        description: 'Check your email for the password reset link.',
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Password reset failed',
        description: mapAuthErrorMessage(error?.message || 'Unable to send reset email right now.'),
        variant: 'destructive',
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
