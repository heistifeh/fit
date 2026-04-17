import React, { createContext, useContext, useState, useEffect } from 'react';
import type { WeightUnit } from '@/utils/weight';

type Preferences = {
  weightUnit: WeightUnit;
  restTimerSecs: number;
  darkMode: boolean;
  reminders: boolean;
  setWeightUnit: (u: WeightUnit) => void;
  setRestTimerSecs: (s: number) => void;
  setDarkMode: (v: boolean) => void;
  setReminders: (v: boolean) => void;
};

const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>(
    (localStorage.getItem('fitnex_weight_unit') as WeightUnit) ?? 'kg',
  );
  const [restTimerSecs, setRestTimerSecsState] = useState<number>(
    parseInt(localStorage.getItem('fitnex_rest_timer') ?? '90', 10),
  );
  const [darkMode, setDarkModeState] = useState<boolean>(
    localStorage.getItem('fitnex_dark_mode') === 'true',
  );
  const [reminders, setRemindersState] = useState<boolean>(
    localStorage.getItem('fitnex_reminders') === 'true',
  );

  // Apply dark class to <html> whenever darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('fitnex_dark_mode', String(darkMode));
  }, [darkMode]);

  const setWeightUnit = (u: WeightUnit) => {
    setWeightUnitState(u);
    localStorage.setItem('fitnex_weight_unit', u);
  };

  const setRestTimerSecs = (s: number) => {
    setRestTimerSecsState(s);
    localStorage.setItem('fitnex_rest_timer', String(s));
  };

  const setDarkMode = (v: boolean) => setDarkModeState(v);

  const setReminders = (v: boolean) => {
    setRemindersState(v);
    localStorage.setItem('fitnex_reminders', String(v));
  };

  return (
    <PreferencesContext.Provider
      value={{ weightUnit, restTimerSecs, darkMode, reminders, setWeightUnit, setRestTimerSecs, setDarkMode, setReminders }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
