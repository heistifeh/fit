import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Bell, Play, ChevronRight, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HomeScreenSkeleton } from '@/components/Skeleton';
import useStore from '@/store';
import dayjs from 'dayjs';
import { WorkoutWithExercises } from '@/types/models';
import { getWorkoutTotalWeight } from '@/services/workoutService';
import {
  screenEnter, staggerContainer, staggerChild, press, overlayFade, sheetSlide,
} from '@/animations/fitnex.variants';
import { usePreferences } from '@/context/PreferencesContext';
import { formatWeight } from '@/utils/weight';
import { useAuthContext } from '@/context/AuthContext';
import { getWorkouts, type WorkoutWithExercisesAndSets } from '@/lib/supabase';
import OnboardingTour from '@/components/OnboardingTour';

// ─── Helpers (local / guest store workouts) ──────────────────────────────────

const fmtKgCompact = (kg: number, unit: 'kg' | 'lbs') => {
  const v = unit === 'lbs' ? kg * 2.2046 : kg;
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));
};

const getStreak = (workouts: WorkoutWithExercises[]) => {
  if (!workouts.length) return 0;
  const days = new Set(workouts.map((w) => dayjs(w.createdAt).format('YYYY-MM-DD')));
  let streak = 0;
  let cur = dayjs();
  while (days.has(cur.format('YYYY-MM-DD'))) { streak++; cur = cur.subtract(1, 'day'); }
  if (streak === 0) {
    cur = dayjs().subtract(1, 'day');
    while (days.has(cur.format('YYYY-MM-DD'))) { streak++; cur = cur.subtract(1, 'day'); }
  }
  return streak;
};

const getWorkoutEmoji = (names: string) => {
  const n = names.toLowerCase();
  if (n.includes('bench') || n.includes('chest') || n.includes('fly')) return '🏋️';
  if (n.includes('dead') || n.includes('row') || n.includes('back'))   return '💀';
  if (n.includes('squat') || n.includes('leg') || n.includes('lunge')) return '🦵';
  return '💪';
};

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ─── Helpers (Supabase workouts) ─────────────────────────────────────────────

const getDbStreak = (workouts: WorkoutWithExercisesAndSets[]) => {
  if (!workouts.length) return 0;
  const days = new Set(workouts.map((w) => dayjs(w.started_at).format('YYYY-MM-DD')));
  let streak = 0;
  let cur = dayjs();
  while (days.has(cur.format('YYYY-MM-DD'))) { streak++; cur = cur.subtract(1, 'day'); }
  if (streak === 0) {
    cur = dayjs().subtract(1, 'day');
    while (days.has(cur.format('YYYY-MM-DD'))) { streak++; cur = cur.subtract(1, 'day'); }
  }
  return streak;
};

const getDbWorkoutLabel = (workout: WorkoutWithExercisesAndSets) => {
  const exs = workout.exercises;
  if (!exs.length) return { name: 'Empty session', emoji: '💪' };
  const names = exs.map((e) => e.name).join(' ');
  const emoji = getWorkoutEmoji(names);
  if (exs.length === 1) return { name: exs[0].name, emoji };
  if (exs.length === 2) return { name: `${exs[0].name} & ${exs[1].name}`, emoji };
  return { name: `${exs[0].name} +${exs.length - 1} more`, emoji };
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  usePageTitle('Home');
  const navigate       = useNavigate();
  const currentWorkout = useStore((s) => s.currentWorkout);
  const startWorkout   = useStore((s) => s.startWorkout);
  const storeWorkouts  = useStore((s) => s.workouts);          // guest / local
  const { weightUnit } = usePreferences();
  const { mode, profile, user } = useAuthContext();
  const displayName = mode === 'guest'
    ? null
    : (profile?.name || user?.user_metadata?.name || null);

  const isAuth    = mode === 'authenticated';
  const isGuest   = mode === 'guest';
  const isTablet  = useMediaQuery('(min-width: 640px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // ── Supabase data (authenticated only) ─────────────────────────────────────
  const [dbWorkouts,         setDbWorkouts]         = useState<WorkoutWithExercisesAndSets[]>([]);
  const [loading,            setLoading]            = useState(mode === 'authenticated');
  const [fetchError,         setFetchError]         = useState(false);
  const [showNotifications,  setShowNotifications]  = useState(false);
  const [toast,              setToast]              = useState<string | null>(null);
  const [showOnboarding,     setShowOnboarding]     = useState(false);
  const onboardingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const fetchHomeWorkouts = () => {
    if (!user) return;
    setLoading(true);
    setFetchError(false);
    const minDelay = new Promise<void>((res) => setTimeout(res, 300));
    Promise.all([minDelay, getWorkouts(user.id)])
      .then(([, data]) => setDbWorkouts(data))
      .catch((err) => {
        console.error('Home: failed to load workouts', err);
        setFetchError(true);
        showToast("Couldn't load workouts — tap retry");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuth || !user) { setLoading(false); return; }
    fetchHomeWorkouts();
  }, [isAuth, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode !== 'authenticated') return;
    const done = localStorage.getItem('fitnex_onboarding_done');
    if (done) return;
    onboardingTimerRef.current = setTimeout(() => setShowOnboarding(true), 800);
    return () => {
      if (onboardingTimerRef.current) clearTimeout(onboardingTimerRef.current);
    };
  }, [mode]);

  const onStart = () => { startWorkout(); navigate('/workout/current'); };

  // ── Derived stats ──────────────────────────────────────────────────────────

  // For authenticated users, derive everything from dbWorkouts (uses denormalized cols).
  // For guests, derive from the local Zustand store.

  const sessionCount: number = isAuth
    ? dbWorkouts.length
    : storeWorkouts.length;

  const totalVolume: number = isAuth
    ? dbWorkouts.reduce((a, w) => a + (Number(w.total_volume_kg) || 0), 0)
    : storeWorkouts.reduce((a, w) => a + getWorkoutTotalWeight(w), 0);

  const streak: number = isAuth
    ? getDbStreak(dbWorkouts)
    : getStreak(storeWorkouts);

  const weekStart = dayjs().startOf('week');
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = weekStart.add(i, 'day');
    const isToday = day.isSame(dayjs(), 'day');
    const isPast  = day.isBefore(dayjs(), 'day');

    const hasWorkout = isAuth
      ? dbWorkouts.some((w) => dayjs(w.started_at).isSame(day, 'day'))
      : storeWorkouts.some((w) => dayjs(w.createdAt).isSame(day, 'day'));

    const volume = isAuth
      ? dbWorkouts
          .filter((w) => dayjs(w.started_at).isSame(day, 'day'))
          .reduce((a, w) => a + (Number(w.total_volume_kg) || 0), 0)
      : storeWorkouts
          .filter((w) => dayjs(w.createdAt).isSame(day, 'day'))
          .reduce((a, w) => a + getWorkoutTotalWeight(w), 0);

    return { day, isToday, isPast, hasWorkout, volume };
  });

  const maxBarVol = Math.max(...weekDays.map((d) => d.volume), 1);

  // ── Recent workouts ────────────────────────────────────────────────────────

  const hasWorkouts = isAuth ? dbWorkouts.length > 0 : storeWorkouts.length > 0;

  return (
    <motion.div
      className="flex flex-col min-h-screen"
      variants={screenEnter}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      {/* ── 1. Header ─────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-[#111] px-5 pt-12 pb-4">
        <div
          className="flex items-start justify-between"
          style={{ maxWidth: isDesktop ? 1200 : '100%', margin: '0 auto' }}
        >
        <div>
          {mode !== 'guest' && (
            <p className="text-sm text-gray-400 leading-none mb-1">Welcome back,</p>
          )}
          <h1 className="text-[28px] font-black leading-tight tracking-tight dark:text-white">
            {mode === 'guest' ? 'Welcome to Fitnex 👋' : `${displayName ?? 'there'} 👋`}
          </h1>
        </div>
        <motion.button
          onClick={() => setShowNotifications(true)}
          className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center mt-1"
          whileTap={press.whileTap}
        >
          <Bell size={19} className="text-gray-500 dark:text-[#555]" />
        </motion.button>
        </div>
      </header>

      {/* ── scrollable body ───────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <HomeScreenSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="flex-1 px-4 pt-4 flex flex-col gap-4"
            style={{ maxWidth: isDesktop ? 1200 : '100%', margin: '0 auto', width: '100%' }}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
          {/* Desktop: 2-column layout wrapper */}
          <div style={isDesktop ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' } : {}}>
          {/* Left column on desktop */}
          <div style={isDesktop ? { display: 'flex', flexDirection: 'column', gap: 16 } : { display: 'contents' }}>
        {/* ── 2. Stats row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3" data-tour="stats-row">
          <motion.div
            variants={staggerChild}
            className="bg-white dark:bg-[#111] rounded-2xl p-4 border border-[#f0f0f0] dark:border-[#1a1a1a] flex flex-col items-center gap-0.5"
          >
            <span className="text-[28px] font-black leading-none text-tint tabular-nums">
              {sessionCount}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">sessions</span>
          </motion.div>

          <motion.div
            variants={staggerChild}
            className="bg-white dark:bg-[#111] rounded-2xl p-4 border border-[#f0f0f0] dark:border-[#1a1a1a] flex flex-col items-center gap-0.5"
          >
            <span className="text-[28px] font-black leading-none text-gray-900 dark:text-white tabular-nums">
              {fmtKgCompact(totalVolume, weightUnit)}
              <span className="text-base font-bold">{weightUnit}</span>
            </span>
            <span className="text-[11px] text-gray-400 font-medium">lifted</span>
          </motion.div>

          <motion.div
            variants={staggerChild}
            className="bg-white dark:bg-[#111] rounded-2xl p-4 border border-[#f0f0f0] dark:border-[#1a1a1a] flex flex-col items-center gap-0.5"
          >
            <span className="text-[28px] font-black leading-none text-gray-900 dark:text-white tabular-nums flex items-center gap-1">
              {streak}
              {streak >= 2 && <Flame size={18} className="text-orange-400 mb-0.5" />}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">streak</span>
          </motion.div>
        </div>

        {/* ── 3. Weekly day strip ─────────────────────────────────────────── */}
        <motion.div
          variants={staggerChild}
          className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] px-4 py-3"
        >
          <div className="grid grid-cols-7">
            {weekDays.map(({ day, isToday, isPast, hasWorkout }, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className={`text-[11px] font-semibold ${
                  isToday ? 'text-tint' :
                  isPast && hasWorkout ? 'text-tint' :
                  'text-gray-400'
                }`}>
                  {DAY_LETTERS[i]}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isToday             ? 'bg-tint'       :
                  isPast && hasWorkout ? 'bg-tint-muted' :
                  ''
                }`}>
                  <span className={`text-[13px] font-bold ${
                    isToday              ? 'text-white' :
                    isPast && hasWorkout ? 'text-tint'  :
                    'text-gray-300'
                  }`}>
                    {day.date()}
                  </span>
                </div>
                <div className={`w-1 h-1 rounded-full ${
                  isToday || (isPast && hasWorkout) ? 'bg-tint' : 'bg-transparent'
                }`} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── 4. Workout progress chart ───────────────────────────────────── */}
        <motion.div
          variants={staggerChild}
          className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-[15px] dark:text-white">Workout Progress</p>
            <span className="bg-tint-muted text-tint text-[11px] font-semibold px-3 py-1 rounded-full">
              Weekly
            </span>
          </div>

          <div className="flex items-end gap-1.5" style={{ height: 108 }}>
            {weekDays.map(({ isToday, volume }, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end" style={{ height: 88 }}>
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isToday ? 'bg-tint' : 'bg-tint-muted dark:bg-tint/20'
                    }`}
                    style={{ height: volume > 0 ? Math.max((volume / maxBarVol) * 80, 4) : 2 }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{DAY_LETTERS[i]}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── 5. Start workout CTA ────────────────────────────────────────── */}
        <div data-tour="start-workout-btn">
        {currentWorkout ? (
          <motion.div variants={staggerChild}>
            <Link to="/workout/current" className="block">
              <motion.div
                className="w-full rounded-2xl px-5 py-[18px] flex items-center gap-4"
                style={{ background: '#10B981', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}
                whileTap={press.whileTap}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                <p className="font-black text-white text-[17px] flex-1">Resume workout</p>
                <ChevronRight size={20} className="text-white/60" />
              </motion.div>
            </Link>
          </motion.div>
        ) : (
          <motion.button
            variants={staggerChild}
            onClick={onStart}
            className="w-full bg-tint rounded-2xl px-5 py-[18px] flex items-center gap-4 text-left shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
            whileTap={press.whileTap}
          >
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Play size={20} className="text-white translate-x-0.5" fill="currentColor" />
            </div>
            <div>
              <p className="font-black text-white text-[17px] leading-snug">Start new workout</p>
              <p className="text-white/70 text-sm mt-0.5">Log sets, reps & weight</p>
            </div>
          </motion.button>
        )}
        </div>{/* /data-tour start-workout-btn */}

        </div>{/* /left column */}

        {/* Right column on desktop (recent workouts + start CTA) */}
        <div style={isDesktop ? { display: 'flex', flexDirection: 'column', gap: 16 } : { display: 'contents' }}>

        {/* ── 6. Recent workouts ──────────────────────────────────────────── */}
        <motion.div variants={staggerChild}>
          <div className="flex items-center justify-between mb-3" data-tour="recent-section">
            <p className="font-bold text-[15px]">Recent</p>
            <button
              onClick={() => navigate('/history')}
              className="text-sm font-semibold text-tint"
            >
              See all
            </button>
          </div>

          {/* ── Empty state (authenticated, no workouts) ──── */}
          {!loading && isAuth && dbWorkouts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏋️</div>
              <p style={{ fontWeight: 700, color: '#111', fontSize: 15, marginBottom: 6 }}>
                No workouts yet
              </p>
              <p style={{ color: '#9ca3af', fontSize: 13 }}>
                Tap "Start new workout" to log your first session
              </p>
            </div>
          )}

          {/* ── Empty state (guest, no workouts) ──── */}
          {isGuest && storeWorkouts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏋️</div>
              <p style={{ fontWeight: 700, color: '#111', fontSize: 15, marginBottom: 6 }}>
                No workouts yet
              </p>
              <p style={{ color: '#9ca3af', fontSize: 13 }}>
                Tap "Start new workout" to log your first session
              </p>
            </div>
          )}

          {/* ── Authenticated: recent from Supabase ──── */}
          {!loading && isAuth && dbWorkouts.length > 0 && (() => {
            const recent = dbWorkouts.slice(0, 3);
            const maxVol = Math.max(...recent.map((w) => Number(w.total_volume_kg) || 0), 1);
            return (
              <motion.div
                className="flex flex-col gap-2.5"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {recent.map((workout) => {
                  const vol      = Number(workout.total_volume_kg) || 0;
                  const progress = (vol / maxVol) * 100;
                  const { name, emoji } = getDbWorkoutLabel(workout);
                  const exCount  = workout.exercises.length;

                  return (
                    <motion.div key={workout.id} variants={staggerChild} whileTap={press.whileTap}>
                      <Link to={`/workout/${workout.id}`} className="block">
                        <div className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] px-4 py-3.5 flex items-center gap-3 active:opacity-70 transition-opacity">
                          <div className="w-11 h-11 rounded-xl bg-tint-muted flex items-center justify-center text-xl shrink-0">
                            {emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[14px] leading-snug truncate dark:text-white">{name}</p>
                            <p className="text-[12px] text-gray-400 mt-0.5">
                              {vol > 0 ? formatWeight(vol, weightUnit) : '—'} · {exCount} exercise{exCount !== 1 ? 's' : ''}
                            </p>
                            <div className="mt-2 h-[3px] bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-tint rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-gray-300 shrink-0" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            );
          })()}

          {/* ── Guest: recent from local store ──── */}
          {isGuest && storeWorkouts.length > 0 && (() => {
            const recent = storeWorkouts.slice(0, 3);
            const maxVol = Math.max(...recent.map((w) => getWorkoutTotalWeight(w)), 1);
            return (
              <motion.div
                className="flex flex-col gap-2.5"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {recent.map((workout) => {
                  const vol      = getWorkoutTotalWeight(workout);
                  const progress = (vol / maxVol) * 100;
                  const names    = workout.exercises.map((e) => e.name).join(' ');
                  const emoji    = getWorkoutEmoji(names);
                  const name     = workout.exercises.length === 0 ? 'Empty session'
                    : workout.exercises.length === 1 ? workout.exercises[0].name
                    : workout.exercises.length === 2 ? `${workout.exercises[0].name} & ${workout.exercises[1].name}`
                    : `${workout.exercises[0].name} +${workout.exercises.length - 1} more`;
                  const exCount  = workout.exercises.length;

                  return (
                    <motion.div key={workout.id} variants={staggerChild} whileTap={press.whileTap}>
                      <Link to={`/workout/${workout.id}`} className="block">
                        <div className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] px-4 py-3.5 flex items-center gap-3 active:opacity-70 transition-opacity">
                          <div className="w-11 h-11 rounded-xl bg-tint-muted flex items-center justify-center text-xl shrink-0">
                            {emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[14px] leading-snug truncate dark:text-white">{name}</p>
                            <p className="text-[12px] text-gray-400 mt-0.5">
                              {vol > 0 ? formatWeight(vol, weightUnit) : '—'} · {exCount} exercise{exCount !== 1 ? 's' : ''}
                            </p>
                            <div className="mt-2 h-[3px] bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-tint rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-gray-300 shrink-0" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            );
          })()}
        </motion.div>

        {/* ── Fetch error retry ───────────────────────────────────────── */}
        {fetchError && !loading && (
          <div className="flex flex-col items-center gap-2 py-6">
            <p className="text-sm text-gray-400">Couldn't load your workouts</p>
            <button
              onClick={fetchHomeWorkouts}
              className="text-tint text-sm font-bold"
            >
              Tap to retry
            </button>
          </div>
        )}

        <div className="pb-6" />
        </div>{/* /right column */}
        </div>{/* /desktop grid */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notifications sheet ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              className="absolute inset-0 bg-black/60"
              variants={overlayFade}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setShowNotifications(false)}
            />
            <motion.div
              className="relative bg-white dark:bg-[#111] rounded-t-3xl w-full px-5 pt-4 pb-10"
              variants={sheetSlide}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="flex justify-center mb-4">
                <div className="w-9 h-1 bg-gray-200 dark:bg-[#333] rounded-full" />
              </div>
              <p className="text-[18px] font-black text-gray-900 dark:text-white mb-5">Notifications</p>
              <div className="flex flex-col items-center gap-3 py-8">
                <span className="text-4xl">🔔</span>
                <p className="font-bold text-[15px] text-gray-800 dark:text-white">No notifications yet</p>
                <p className="text-[13px] text-gray-400 text-center leading-relaxed max-w-[240px]">
                  We'll notify you about streaks, PRs and weekly summaries.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-[70] bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-semibold px-4 py-2.5 rounded-2xl shadow-lg whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Onboarding tour ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingTour onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
