import { Suspense, lazy } from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuthContext } from '@/context/AuthContext';
import { PreferencesProvider } from '@/context/PreferencesContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/general/Layout';
import SplashScreen from '@/pages/auth/SplashScreen';
import Home         from '@/pages/Home';

// Everything past the first paint is code-split so the initial bundle
// (and therefore time-to-interactive on a cold mobile load) stays small.
const SignUpScreen         = lazy(() => import('@/pages/auth/SignUpScreen'));
const SignInScreen         = lazy(() => import('@/pages/auth/SignInScreen'));
const ForgotPasswordScreen = lazy(() => import('@/pages/auth/ForgotPasswordScreen'));
const ResetPasswordScreen  = lazy(() => import('@/pages/auth/ResetPasswordScreen'));
const OnboardingQuiz       = lazy(() => import('@/components/OnboardingQuiz'));
const History              = lazy(() => import('@/pages/History'));
const Stats                = lazy(() => import('@/pages/Stats'));
const Profile              = lazy(() => import('@/pages/Profile'));
const CurrentWorkout       = lazy(() => import('@/pages/CurrentWorkout'));
const WorkoutDetail        = lazy(() => import('@/pages/WorkoutDetail'));
const WorkoutSummary       = lazy(() => import('@/pages/WorkoutSummary'));

function RouteFallback() {
  return (
    <div style={{ background: '#080808', height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} />
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>FITNEX</span>
      </div>
    </div>
  );
}

// ─── App shell (MemoryRouter ensures we always boot at /) ────────────────────

function AnimatedRoutes({ showGuestNudge }: { showGuestNudge: boolean }) {
  const location = useLocation();
  return (
    <div className="animated-screen-wrapper" style={{ minHeight: '100dvh' }}>
      <AnimatePresence mode="wait">
        <Suspense fallback={<RouteFallback />}>
          <Routes location={location} key={location.pathname}>
            {/* Full-screen — no Layout wrapper */}
            <Route path="/workout/summary" element={<ErrorBoundary><WorkoutSummary /></ErrorBoundary>} />

            <Route element={<Layout showGuestNudge={showGuestNudge} />}>
              <Route path="/"                element={<ErrorBoundary><Home /></ErrorBoundary>} />
              <Route path="/history"         element={<ErrorBoundary><History /></ErrorBoundary>} />
              <Route path="/stats"           element={<ErrorBoundary><Stats /></ErrorBoundary>} />
              <Route path="/profile"         element={<ErrorBoundary><Profile /></ErrorBoundary>} />
              <Route path="/workout/current" element={<ErrorBoundary><CurrentWorkout /></ErrorBoundary>} />
              <Route path="/workout/:id"     element={<ErrorBoundary><WorkoutDetail /></ErrorBoundary>} />
            </Route>
          </Routes>
        </Suspense>
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

  if (mode === 'loading') return <RouteFallback />;

  if (mode === 'guest')         return <AppShell showGuestNudge={true} />;
  if (mode === 'authenticated') return <AppShell showGuestNudge={false} />;

  return (
    <Suspense fallback={<RouteFallback />}>
      {mode === 'splash'          && <SplashScreen />}
      {mode === 'quiz'            && <OnboardingQuiz />}
      {mode === 'signup'          && <SignUpScreen />}
      {mode === 'signin'          && <SignInScreen />}
      {mode === 'forgot-password' && <ForgotPasswordScreen />}
      {mode === 'reset-password'  && <ResetPasswordScreen />}
    </Suspense>
  );
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
