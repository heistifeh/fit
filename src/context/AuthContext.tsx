import React, { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/context/PreferencesContext';

type AuthContextType = ReturnType<typeof useAuth>;

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setWeightUnit, setRestTimerSecs, setDarkMode, setReminders } = usePreferences();
  const auth = useAuth({ setWeightUnit, setRestTimerSecs, setDarkMode, setReminders });
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
