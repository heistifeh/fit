import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { WeightUnit } from '@/utils/weight';

// 'signup' and 'signin' are UI-only modes driven by setMode (not Supabase state).
// 'loading'       — checking existing session on mount
// 'splash'        — no session, show splash
// 'signup'        — user navigated to sign-up form
// 'signin'        — user navigated to sign-in form
// 'forgot-password' — forgot password form
// 'reset-password'  — password reset (after clicking email link)
// 'guest'         — bypassed auth, no Supabase user
// 'authenticated' — valid Supabase session
export type AuthMode =
  | 'loading' | 'splash' | 'signup' | 'signin'
  | 'forgot-password' | 'reset-password'
  | 'guest' | 'authenticated';

// Shape of the profile data we keep in memory
export type ProfileData = {
  name:            string;
  handle:          string | null;
  avatar_url:      string | null;
  weight_unit:     WeightUnit;
  rest_timer_secs: number;
  dark_mode:       boolean;
  reminders:       boolean;
  weekly_goal:     number | null;
  volume_goal:     number | null;
  created_at:      string;
};

// Preference sync callbacks — supplied by AuthProvider which sits inside
// PreferencesProvider and therefore has access to usePreferences().
type SyncPrefs = {
  setWeightUnit:    (u: WeightUnit) => void;
  setRestTimerSecs: (s: number) => void;
  setDarkMode:      (v: boolean) => void;
  setReminders:     (v: boolean) => void;
};

export const useAuth = (prefs: SyncPrefs) => {
  const [mode,    setMode]    = useState<AuthMode>('loading');
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('name, handle, avatar_url, weight_unit, rest_timer_secs, dark_mode, reminders, weekly_goal, volume_goal, created_at')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data as ProfileData);
      // Sync stored preferences into PreferencesContext so the whole app
      // immediately reflects the user's saved settings.
      prefs.setWeightUnit(data.weight_unit ?? 'kg');
      prefs.setRestTimerSecs(data.rest_timer_secs ?? 90);
      prefs.setDarkMode(data.dark_mode ?? false);
      prefs.setReminders(data.reminders ?? false);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch profile from Supabase (call after any profile update to sync local state)
  const refreshProfile = () => {
    if (user?.id) fetchProfile(user.id);
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
    refreshProfile,
    signInWithGoogle,
    continueAsGuest,
    signOut,
  };
};
