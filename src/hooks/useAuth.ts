import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

// 'signup' and 'signin' are UI-only modes driven by setMode (not Supabase state).
// 'loading'       — checking existing session on mount
// 'splash'        — no session, show splash
// 'signup'        — user navigated to sign-up form
// 'signin'        — user navigated to sign-in form
// 'guest'         — bypassed auth, no Supabase user
// 'authenticated' — valid Supabase session
export type AuthMode = 'loading' | 'splash' | 'signup' | 'signin' | 'forgot-password' | 'reset-password' | 'guest' | 'authenticated';

export const useAuth = () => {
  const [mode,    setMode]    = useState<AuthMode>('loading');
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<{ name: string; handle: string; avatar_url?: string | null } | null>(null);

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
        setMode('authenticated');
      } else {
        setMode('splash');
      }
    });

    // Listen for auth state changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Password reset link clicked — show the reset password screen
        if (event === 'PASSWORD_RECOVERY') {
          setMode('reset-password');
          return;
        }
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
          setMode('authenticated');
          // Clean up the URL after OAuth / email confirmation redirect
          if (event === 'SIGNED_IN' && (window.location.hash || window.location.search.includes('code='))) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        } else {
          setUser(null);
          setProfile(null);
          setMode('splash');
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('name, handle, avatar_url')
      .eq('id', userId)
      .single();
    if (data) setProfile(data as { name: string; handle: string; avatar_url?: string | null });
  };

  const signUp = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
    // Profile row is auto-created by the handle_new_user trigger.
    // Update name separately since the trigger reads raw_user_meta_data.
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ name })
        .eq('id', data.user.id);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
  };

  const continueAsGuest = () => {
    setMode('guest');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('nudgeDismissed');
    localStorage.removeItem('fitnex_weight_unit');
    localStorage.removeItem('fitnex_rest_timer');
    localStorage.removeItem('fitnex_dark_mode');
    localStorage.removeItem('fitnex_reminders');
    setMode('splash');
  };

  return {
    mode,
    user,
    profile,
    setMode,
    signUp,
    signIn,
    resetPassword,
    signInWithGoogle,
    continueAsGuest,
    signOut,
  };
};
