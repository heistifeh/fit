import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuthContext } from '@/context/AuthContext';
import Layout from '@/components/general/Layout';
import { GuestNudgeSheet } from '@/components/general/GuestNudgeBanner';
import SplashScreen   from '@/pages/auth/SplashScreen';
import SignUpScreen   from '@/pages/auth/SignUpScreen';
import SignInScreen   from '@/pages/auth/SignInScreen';
import Home           from '@/pages/Home';
import History        from '@/pages/History';
import Stats          from '@/pages/Stats';
import Profile        from '@/pages/Profile';
import CurrentWorkout from '@/pages/CurrentWorkout';
import WorkoutDetail  from '@/pages/WorkoutDetail';
import WorkoutSummary from '@/pages/WorkoutSummary';

// ─── App shell (BrowserRouter + routes) ──────────────────────────────────────

function AnimatedRoutes({ showGuestNudge }: { showGuestNudge: boolean }) {
  const location = useLocation();
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Full-screen — no Layout wrapper */}
          <Route path="/workout/summary" element={<WorkoutSummary />} />

          <Route element={<Layout showGuestNudge={showGuestNudge} />}>
            <Route path="/"                element={<Home />} />
            <Route path="/history"         element={<History />} />
            <Route path="/stats"           element={<Stats />} />
            <Route path="/profile"         element={<Profile />} />
            <Route path="/workout/current" element={<CurrentWorkout />} />
            <Route path="/workout/:id"     element={<WorkoutDetail />} />
          </Route>
        </Routes>
      </AnimatePresence>

      {/* Guest nudge sheet (fixed overlay — renders outside route tree) */}
      {showGuestNudge && <GuestNudgeSheet />}
    </>
  );
}

function AppShell({ showGuestNudge }: { showGuestNudge: boolean }) {
  return (
    <BrowserRouter>
      <AnimatedRoutes showGuestNudge={showGuestNudge} />
    </BrowserRouter>
  );
}

// ─── Auth gate ────────────────────────────────────────────────────────────────

function AuthGate() {
  const { mode } = useAuthContext();

  if (mode === 'splash')        return <SplashScreen />;
  if (mode === 'signup')        return <SignUpScreen />;
  if (mode === 'signin')        return <SignInScreen />;
  if (mode === 'guest')         return <AppShell showGuestNudge={true} />;
  if (mode === 'authenticated') return <AppShell showGuestNudge={false} />;
  return null;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
