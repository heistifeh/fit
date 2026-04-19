import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuthContext } from '@/context/AuthContext';
import { PreferencesProvider } from '@/context/PreferencesContext';
import Layout from '@/components/general/Layout';
import SplashScreen          from '@/pages/auth/SplashScreen';
import SignUpScreen          from '@/pages/auth/SignUpScreen';
import SignInScreen          from '@/pages/auth/SignInScreen';
import ForgotPasswordScreen  from '@/pages/auth/ForgotPasswordScreen';
import ResetPasswordScreen   from '@/pages/auth/ResetPasswordScreen';
import Home           from '@/pages/Home';
import History        from '@/pages/History';
import Stats          from '@/pages/Stats';
import Profile        from '@/pages/Profile';
import CurrentWorkout from '@/pages/CurrentWorkout';
import WorkoutDetail  from '@/pages/WorkoutDetail';
import WorkoutSummary from '@/pages/WorkoutSummary';

// ─── App shell (MemoryRouter ensures we always boot at /) ────────────────────

function AnimatedRoutes({ showGuestNudge }: { showGuestNudge: boolean }) {
  const location = useLocation();
  return (
    <div className="animated-screen-wrapper" style={{ minHeight: '100dvh' }}>
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
    </div>
  );
}

function AppShell({ showGuestNudge }: { showGuestNudge: boolean }) {
  return (
    <MemoryRouter initialEntries={['/']} initialIndex={0}>
      <AnimatedRoutes showGuestNudge={showGuestNudge} />
    </MemoryRouter>
  );
}

// ─── Auth gate ────────────────────────────────────────────────────────────────

function AuthGate() {
  const { mode } = useAuthContext();

  if (mode === 'loading') return (
    <div style={{
      background: '#080808',
      height: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} />
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>FITNEX</span>
      </div>
    </div>
  );

  if (mode === 'splash')          return <SplashScreen />;
  if (mode === 'signup')          return <SignUpScreen />;
  if (mode === 'signin')          return <SignInScreen />;
  if (mode === 'forgot-password') return <ForgotPasswordScreen />;
  if (mode === 'reset-password')  return <ResetPasswordScreen />;
  if (mode === 'guest')           return <AppShell showGuestNudge={true} />;
  if (mode === 'authenticated')   return <AppShell showGuestNudge={false} />;
  return null;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div style={{ overflowX: 'hidden', width: '100%', maxWidth: '100vw', minHeight: '100dvh', position: 'relative' }}>
      <PreferencesProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </PreferencesProvider>
    </div>
  );
}
