import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type AccountType = 'patient' | 'doctor' | 'admin';

const AUTH_TIMEOUT_MS = 15000;
const AUTH_FETCH_TIMEOUT_MS = 20000;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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

const isNetworkAuthError = (message?: string) => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes('failed to fetch') ||
    normalized.includes('networkerror') ||
    normalized.includes('load failed') ||
    normalized.includes('network request failed') ||
    normalized.includes('timed out')
  );
};

type AuthSessionPayload = {
  access_token: string;
  refresh_token: string;
};

const authFetch = async <T,>(path: string, payload: Record<string, unknown>): Promise<T> => {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Auth service is not configured. Please contact support.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error((json as any)?.msg || (json as any)?.error_description || (json as any)?.error || `Auth request failed (${response.status})`);
    }

    return json as T;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again in a moment.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const applyFallbackSession = async (session: AuthSessionPayload) => {
  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (error) {
    throw error;
  }
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

  const signInWithFallback = async (normalizedEmail: string, password: string) => {
    const payload = await authFetch<{
      access_token?: string;
      refresh_token?: string;
      user?: User;
    }>('token?grant_type=password', {
      email: normalizedEmail,
      password,
      gotrue_meta_security: {},
    });

    if (!payload.access_token || !payload.refresh_token) {
      throw new Error('Unable to establish a secure session. Please try again.');
    }

    await applyFallbackSession({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
    });

    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !sessionData.session) {
      throw sessionErr || new Error('Unable to restore your session after sign in.');
    }

    return sessionData.session;
  };

  const signUp = async (email: string, password: string, fullName: string, accountType: AccountType = 'patient') => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      setLoading(true);

      let signUpData: any = null;

      try {
        const { data, error: signUpErr } = await withTimeout(
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
        signUpData = data;
      } catch (signUpError: any) {
        if (!isNetworkAuthError(signUpError?.message)) throw signUpError;

        signUpData = await authFetch<any>('signup', {
          email: normalizedEmail,
          password,
          data: { full_name: fullName, account_type: accountType },
        });

        if (signUpData?.access_token && signUpData?.refresh_token) {
          await applyFallbackSession({
            access_token: signUpData.access_token,
            refresh_token: signUpData.refresh_token,
          });
        }
      }

      if (signUpData?.session || (signUpData?.access_token && signUpData?.refresh_token)) {
        toast({
          title: 'Account created',
          description: 'Your MEDITALK account is ready and you are signed in.',
        });
        return { data: signUpData, error: null };
      }

      let lastSignInError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 500));

        try {
          const { data, error } = await withTimeout(
            supabase.auth.signInWithPassword({ email: normalizedEmail, password }),
            'Sign in request'
          );

          if (error) throw error;

          toast({
            title: 'Account created',
            description: 'Your MEDITALK account is ready and you are signed in.',
          });
          return { data, error: null };
        } catch (attemptError: any) {
          if (isNetworkAuthError(attemptError?.message)) {
            try {
              const session = await signInWithFallback(normalizedEmail, password);
              toast({
                title: 'Account created',
                description: 'Your MEDITALK account is ready and you are signed in.',
              });
              return { data: { user: session.user, session }, error: null };
            } catch (fallbackError: any) {
              lastSignInError = fallbackError;
            }
          } else {
            lastSignInError = attemptError;
          }
        }
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

      let signedInUser: User | null = null;

      try {
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

        signedInUser = data.user;
      } catch (signInError: any) {
        if (!isNetworkAuthError(signInError?.message)) throw signInError;
        const session = await signInWithFallback(normalizedEmail, password);
        signedInUser = session.user;
      }

      const userId = signedInUser?.id;

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

      if (accountType && userId) {
        await supabase.auth.updateUser({
          data: { account_type: accountType },
        }).catch(() => {});
      }

      const { data: finalSession } = await supabase.auth.getSession();
      return { data: { user: signedInUser, session: finalSession.session }, error: null };
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
