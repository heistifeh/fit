import { useState, useEffect } from 'react';
import { Dumbbell, Calendar, Clock } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { motion, AnimatePresence } from 'framer-motion';
import { StatsScreenSkeleton } from '@/components/Skeleton';
import {
  AreaChart, Area, XAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import {
  screenEnter, staggerContainer, staggerChild, SPRING,
} from '@/animations/fitnex.variants';
import { usePreferences } from '@/context/PreferencesContext';
import { formatWeight } from '@/utils/weight';
import { useAuthContext } from '@/context/AuthContext';
import useStore from '@/store';
import {
  getWorkouts, getPersonalRecords,
  type WorkoutWithExercisesAndSets, type PersonalRecord,
} from '@/lib/supabase';

dayjs.extend(isoWeek);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERIOD_PILLS = ['Week', 'Month', '3 Months', 'All time'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function computeStreak(isoDates: string[]): number {
  if (!isoDates.length) return 0;
  const workoutDays = new Set(isoDates.map((d) => dayjs(d).format('YYYY-MM-DD')));
  let streak = 0;
  let cursor = dayjs();
  while (workoutDays.has(cursor.format('YYYY-MM-DD'))) {
    streak++;
    cursor = cursor.subtract(1, 'day');
  }
  return streak;
}

function barColor(pct: number) {
  if (pct >= 70) return '#10B981';
  if (pct >= 50) return '#6ee7b7';
  if (pct >= 30) return '#a7f3d0';
  return '#d1fae5';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrendBadge({ value }: { value: string | null }) {
  if (!value) return null;
  const negative = value.startsWith('-');
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
      negative ? 'bg-red-50 text-red-500' : 'bg-[#d1fae5] text-tint'
    }`}>
      {value}
    </span>
  );
}

function ChartTooltip({ active, payload, label, weightUnit }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  weightUnit: 'kg' | 'lbs';
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#1a1a1a] rounded-xl px-3 py-2 shadow-lg text-[12px]">
      <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name === 'thisWeek' ? 'This week' : 'Last week'}:{' '}
          {p.value > 0 ? formatWeight(p.value, weightUnit) : '—'}
        </p>
      ))}
    </div>
  );
}

function SkeletonCard({ tall }: { tall?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#f0f0f0] p-4 animate-pulse ${tall ? 'h-40' : ''}`}>
      <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
      <div className="h-6 w-28 bg-gray-100 rounded" />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Stats() {
  usePageTitle('Stats');
  const { mode, user } = useAuthContext();
  const storeWorkouts = useStore((s) => s.workouts);
  const { weightUnit } = usePreferences();

  const [dbWorkouts, setDbWorkouts] = useState<WorkoutWithExercisesAndSets[]>([]);
  const [dbPRs,      setDbPRs]      = useState<PersonalRecord[]>([]);
  const [loading,    setLoading]    = useState(mode === 'authenticated');
  const [activePeriod, setActivePeriod] = useState('Week');

  useEffect(() => {
    if (mode !== 'authenticated' || !user?.id) { setLoading(false); return; }
    const minDelay = new Promise<void>((res) => setTimeout(res, 300));
    const dataFetch = Promise.all([getWorkouts(user.id), getPersonalRecords(user.id)]);
    Promise.all([minDelay, dataFetch])
      .then(([, [workouts, prs]]) => { setDbWorkouts(workouts); setDbPRs(prs); })
      .catch((err) => console.error('Stats: failed to load', err))
      .finally(() => setLoading(false));
  }, [mode, user?.id]);

  // ── Derived data ────────────────────────────────────────────────────────────
  const today          = dayjs();
  const thisWeekStart  = today.startOf('isoWeek');  // Mon
  const lastWeekStart  = thisWeekStart.subtract(1, 'week');
  const thisMonthStart = today.startOf('month');
  const threeMonthsStart = today.subtract(3, 'month');

  // All workouts (auth = DB, guest = store)
  type SimpleWorkout = { isoDate: string; volume: number; durationSecs: number };

  const allSimple: SimpleWorkout[] = mode === 'authenticated'
    ? dbWorkouts.map((w) => ({
        isoDate:     w.started_at,
        volume:      Number(w.total_volume_kg) || 0,
        durationSecs: w.duration_secs ?? 0,
      }))
    : [...storeWorkouts]
        .filter((w) => w.finishedAt)
        .map((w) => {
          const vol = w.exercises.flatMap((e) => e.sets)
            .filter((s) => (s.reps ?? 0) > 0)
            .reduce((a, s) => a + (s.weight ?? 0) * (s.reps ?? 0), 0);
          const dur = w.finishedAt ? dayjs(w.finishedAt).diff(dayjs(w.createdAt), 'second') : 0;
          return { isoDate: w.createdAt.toISOString(), volume: vol, durationSecs: dur };
        });

  // Period filter
  const periodWorkouts = allSimple.filter((w) => {
    const d = dayjs(w.isoDate);
    if (activePeriod === 'Week')      return !d.isBefore(thisWeekStart);
    if (activePeriod === 'Month')     return !d.isBefore(thisMonthStart);
    if (activePeriod === '3 Months')  return !d.isBefore(threeMonthsStart);
    return true;
  });

  const lastPeriodWorkouts = allSimple.filter((w) => {
    const d = dayjs(w.isoDate);
    if (activePeriod === 'Week')
      return d.isBefore(thisWeekStart) && !d.isBefore(lastWeekStart);
    return false;
  });

  const totalVolume   = periodWorkouts.reduce((a, w) => a + w.volume, 0);
  const lastVolume    = lastPeriodWorkouts.reduce((a, w) => a + w.volume, 0);
  const volumeTrend   = lastVolume > 0
    ? `${totalVolume >= lastVolume ? '+' : ''}${Math.round(((totalVolume - lastVolume) / lastVolume) * 100)}%`
    : null;

  const sessions      = periodWorkouts.length;
  const lastSessions  = lastPeriodWorkouts.length;
  const sessionsTrend = lastSessions > 0
    ? `${sessions >= lastSessions ? '+' : ''}${sessions - lastSessions}`
    : null;

  const avgDurationMins = sessions > 0
    ? Math.round(periodWorkouts.reduce((a, w) => a + w.durationSecs, 0) / sessions / 60)
    : 0;

  const streak = computeStreak(allSimple.map((w) => w.isoDate));

  // ── Weekly chart data (always Mon–Sun of current and last week) ─────────────
  const weeklyVolumeData = DAYS.map((day, i) => {
    const thisDay = thisWeekStart.add(i, 'day');
    const lastDay = lastWeekStart.add(i, 'day');
    const thisVol = allSimple
      .filter((w) => dayjs(w.isoDate).isSame(thisDay, 'day'))
      .reduce((a, w) => a + w.volume, 0);
    const lastVol = allSimple
      .filter((w) => dayjs(w.isoDate).isSame(lastDay, 'day'))
      .reduce((a, w) => a + w.volume, 0);
    return { day, thisWeek: thisVol, lastWeek: lastVol };
  });

  // ── Guest-mode personal records (derived from store) ───────────────────────
  type GuestPR = { exercise: string; kg: number; reps: number; date: string };
  const guestPRs: GuestPR[] = [];
  if (mode !== 'authenticated') {
    const bestByEx: Record<string, GuestPR> = {};
    for (const w of storeWorkouts) {
      for (const ex of w.exercises) {
        for (const s of ex.sets) {
          const kg = s.weight ?? 0;
          const reps = s.reps ?? 0;
          if (kg <= 0 || reps <= 0) continue;
          const prev = bestByEx[ex.name];
          if (!prev || kg * reps > prev.kg * prev.reps) {
            bestByEx[ex.name] = {
              exercise: ex.name,
              kg,
              reps,
              date: dayjs(w.createdAt).format('ddd, D MMM'),
            };
          }
        }
      }
    }
    guestPRs.push(...Object.values(bestByEx).sort((a, b) => b.kg * b.reps - a.kg * a.reps));
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="flex flex-col min-h-screen"
      variants={screenEnter}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >

      {/* ── 1. Header ─────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-[#1a1a1a] px-5 pt-12 pb-0">
        <h1 className="text-[28px] font-black leading-tight tracking-tight mb-4 dark:text-white">
          Stats
        </h1>

        <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          {PERIOD_PILLS.map((p) => (
            <motion.button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
                activePeriod === p
                  ? 'bg-tint text-white border-tint'
                  : 'bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-[#555] border-gray-200 dark:border-[#333]'
              }`}
              whileTap={{ scale: 0.96 }}
            >
              {p}
            </motion.button>
          ))}
        </div>
      </header>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div className="flex-1 pb-[90px]">
        <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            className="pt-4"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <StatsScreenSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* ── 2. Overview Cards ───────────────────────────────────────────── */}
            <motion.div
              className="px-4 pt-4 grid grid-cols-2 gap-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >

              {/* Total volume */}
              <motion.div variants={staggerChild} className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl bg-tint-muted flex items-center justify-center">
                    <Dumbbell size={15} className="text-tint" />
                  </div>
                  <TrendBadge value={volumeTrend} />
                </div>
                <p className="text-[24px] font-black leading-none tabular-nums dark:text-white">
                  {totalVolume > 0 ? formatWeight(totalVolume, weightUnit) : '—'}
                </p>
                <p className="text-[12px] text-gray-400 font-medium mt-1">Total volume</p>
              </motion.div>

              {/* Workouts */}
              <motion.div variants={staggerChild} className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl bg-tint-muted flex items-center justify-center">
                    <Calendar size={15} className="text-tint" />
                  </div>
                  <TrendBadge value={sessionsTrend} />
                </div>
                <p className="text-[24px] font-black leading-none tabular-nums dark:text-white">
                  {sessions}
                </p>
                <p className="text-[12px] text-gray-400 font-medium mt-1">Workouts</p>
              </motion.div>

              {/* Avg duration */}
              <motion.div variants={staggerChild} className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl bg-tint-muted flex items-center justify-center">
                    <Clock size={15} className="text-tint" />
                  </div>
                </div>
                <p className="text-[24px] font-black leading-none tabular-nums dark:text-white">
                  {avgDurationMins > 0 ? (
                    <>{avgDurationMins}<span className="text-[14px] font-bold text-gray-400 ml-0.5">m avg</span></>
                  ) : '—'}
                </p>
                <p className="text-[12px] text-gray-400 font-medium mt-1">Avg duration</p>
              </motion.div>

              {/* Streak */}
              <motion.div variants={staggerChild} className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-lg leading-none">
                    🔥
                  </div>
                  {streak >= 3 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-500">
                      🔥 on fire
                    </span>
                  )}
                </div>
                <p className="text-[24px] font-black leading-none tabular-nums dark:text-white">
                  {streak}
                  <span className="text-[14px] font-bold text-gray-400 ml-0.5">days</span>
                </p>
                <p className="text-[12px] text-gray-400 font-medium mt-1">Current streak</p>
              </motion.div>
            </motion.div>

            {/* ── 3. Volume Chart ─────────────────────────────────────────────── */}
            <motion.div
              className="px-4 pt-5"
              variants={staggerChild}
              initial="initial"
              animate="animate"
            >
              <p className="text-[16px] font-bold mb-3 dark:text-white">Volume this week</p>
              <div className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] pt-4 pb-2 px-2">
                <div className="flex items-center gap-4 px-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-tint" />
                    <span className="text-[12px] text-gray-500 font-semibold">This week</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#6ee7b7]" />
                    <span className="text-[12px] text-gray-500 font-semibold">Last week</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={120}>
                  <AreaChart data={weeklyVolumeData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="thisWeekGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10B981" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="lastWeekGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6ee7b7" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 600, fill: '#9ca3af' }}
                      dy={6}
                    />
                    <Tooltip
                      content={<ChartTooltip weightUnit={weightUnit} />}
                      cursor={{ stroke: '#f0f0f0', strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="lastWeek"
                      stroke="#6ee7b7"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      fill="url(#lastWeekGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#6ee7b7', strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="thisWeek"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fill="url(#thisWeekGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* ── 4. Personal Records ─────────────────────────────────────────── */}
            <motion.div
              className="px-4 pt-5"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <p className="text-[16px] font-bold mb-3 dark:text-white">Personal Records</p>

              {/* Auth PRs */}
              {mode === 'authenticated' && dbPRs.length === 0 && !loading && (
                <div className="bg-white rounded-2xl border border-[#f0f0f0] py-10 flex flex-col items-center gap-2">
                  <p className="text-3xl">🏆</p>
                  <p className="text-sm text-gray-400 font-medium">No personal records yet</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {mode === 'authenticated'
                  ? dbPRs.slice(0, 10).map((pr) => (
                      <motion.div
                        key={pr.id}
                        variants={staggerChild}
                        className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] px-4 py-3.5 flex items-center gap-3"
                      >
                        <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
                          🏆
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[14px] leading-snug dark:text-white">
                            {pr.exercise_name}
                          </p>
                          <p className="text-[12px] text-gray-400 mt-0.5">
                            {dayjs(pr.achieved_at).format('ddd, D MMM')} · {pr.reps} reps
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <p className="font-black text-[16px] text-gray-900 dark:text-white tabular-nums">
                            {formatWeight(pr.weight_kg, weightUnit)}
                          </p>
                          {pr.one_rm && (
                            <span className="text-[11px] font-bold text-tint bg-tint-muted px-2 py-0.5 rounded-full">
                              {formatWeight(pr.one_rm, weightUnit)} 1RM
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))
                  : guestPRs.map((pr, i) => (
                      <motion.div
                        key={i}
                        variants={staggerChild}
                        className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] px-4 py-3.5 flex items-center gap-3"
                      >
                        <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
                          🏆
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[14px] leading-snug dark:text-white">
                            {pr.exercise}
                          </p>
                          <p className="text-[12px] text-gray-400 mt-0.5">
                            {pr.date} · {pr.reps} reps
                          </p>
                        </div>
                        <p className="font-black text-[16px] text-gray-900 dark:text-white tabular-nums shrink-0">
                          {formatWeight(pr.kg, weightUnit)}
                        </p>
                      </motion.div>
                    ))
                }

                {mode !== 'authenticated' && guestPRs.length === 0 && (
                  <div className="bg-white rounded-2xl border border-[#f0f0f0] py-10 flex flex-col items-center gap-2">
                    <p className="text-3xl">🏆</p>
                    <p className="text-sm text-gray-400 font-medium">No personal records yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
