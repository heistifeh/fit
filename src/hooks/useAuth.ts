import { useState } from 'react';

export type AuthMode = 'splash' | 'signup' | 'signin' | 'guest' | 'authenticated';

export const useAuth = () => {
  const [mode, setMode] = useState<AuthMode>('splash');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  const signUp = async (name: string, email: string, _password: string) => {
    // TODO: replace with real API call
    setUser({ name, email });
    setMode('authenticated');
  };

  const signIn = async (email: string, _password: string) => {
    // TODO: replace with real API call
    setUser({ name: 'Tife', email });
    setMode('authenticated');
  };

  const continueAsGuest = () => setMode('guest');
  const signOut = () => { setUser(null); setMode('splash'); };

  return { mode, user, setMode, signUp, signIn, continueAsGuest, signOut };
};
