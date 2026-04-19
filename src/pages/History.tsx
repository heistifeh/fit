import { useState, useEffect } from 'react';
import { Clock, Dumbbell, CheckSquare } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { motion, AnimatePresence } from 'framer-motion';
import { HistoryScreenSkeleton } from '@/components/Skeleton';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import {
  screenEnter, staggerContainer, staggerChild, press,
} from '@/animations/fitnex.variants';
import WorkoutDetailScreen, {
  type WorkoutDetail, type DetailExercise, type DetailSet,
} from './WorkoutDetailScreen';
import { usePreferences } from '@/context/PreferencesContext';
import { formatWeight } from '@/utils/weight';
import { useAuthContext } from '@/context/AuthContext';
import useStore from '@/store';
import { getWorkouts, type WorkoutWithExercisesAndSets } from '@/lib/supabase';
import { type WorkoutWithExercises } from '@/types/models';

dayjs.extend(isoWeek);

// ─── Local unified shape ──────────────────────────────────────────────────────

type HistoryEntry = {
  detail: WorkoutDetail;
  isoDate: string;   // raw ISO for grouping
};

// ─── Adapters ─────────────────────────────────────────────────────────────────

function dbWorkoutToEntry(
  w: WorkoutWithExercisesAndSets,
  allWorkouts: WorkoutWithExercisesAndSets[],
): HistoryEntry {
  const started = dayjs(w.started_at);
  const olderWorkouts = allWorkouts.filter(
    (o) => new Date(o.started_at) < new Date(w.started_at),
  );

  // Best weight per exercise name across older workouts
  const histMax: Record<string, number> = {};
  for (const old of olderWorkouts) {
    for (const ex of old.exercises) {
      for (const s of ex.sets) {
        const kg = Number(s.weight_kg) || 0;
        if (kg > 0) histMax[ex.name] = Math.max(histMax[ex.name] ?? 0, kg);
      }
    }
  }

  let prExercise: string | undefined;
  let prKg: number | undefined;
  let prReps: number | undefined;
  let hasPR = false;

  const exercises: DetailExercise[] = w.exercises.map((ex) => {
    const prevMax = histMax[ex.name] ?? 0;
    const sets: DetailSet[] = ex.sets.map((s) => {
      const kg = Number(s.weight_kg) || 0;
      const reps = Number(s.reps) || 0;
      const isPR = kg > 0 && kg > prevMax;
      if (isPR && !hasPR) {
        prExercise = ex.name;
        prKg = kg;
        prReps = reps;
        hasPR = true;
      }
      return {
        set_number: s.set_number,
        weight_kg:  kg,
        reps,
        is_completed: s.is_completed,
        is_pr: isPR,
      };
    });
    const total_volume = sets
      .filter((s) => s.is_completed)
      .reduce((a, s) => a + s.weight_kg * s.reps, 0);
    return { id: ex.id, name: ex.name, emoji: ex.emoji, total_volume, sets };
  });

  const finished = w.finished_at
    ? dayjs(w.finished_at)
    : started.add(w.duration_secs ?? 0, 'second');

  const diffDays = dayjs().diff(started, 'day');
  const daysAgoLabel =
    diffDays === 0 ? 'today' : diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;

  const detail: WorkoutDetail = {
    id:              w.id,
    date:            started.format('ddd, D MMM'),
    started_at:      started.format('h:mm A'),
    finished_at:     finished.format('h:mm A'),
    duration_secs:   w.duration_secs ?? 0,
    total_volume_kg: Number(w.total_volume_kg) || 0,
    total_sets:      Number(w.total_sets) || 0,
    hasPR,
    prExercise,
    prKg,
    prReps,
    days_ago_label: daysAgoLabel,
    exercises,
  };

  return { detail, isoDate: w.started_at };
}

function storeWorkoutToEntry(
  w: WorkoutWithExercises,
  allWorkouts: WorkoutWithExercises[],
): HistoryEntry {
  const started = dayjs(w.createdAt);
  const olderWorkouts = allWorkouts.filter((o) => o.createdAt < w.createdAt);

  const histMax: Record<string, number> = {};
  for (const old of olderWorkouts) {
    for (const ex of old.exercises) {
      for (const s of ex.sets) {
        const kg = s.weight ?? 0;
        if (kg > 0) histMax[ex.name] = Math.max(histMax[ex.name] ?? 0, kg);
      }
    }
  }

  let prExercise: string | undefined;
  let prKg: number | undefined;
  let prReps: number | undefined;
  let hasPR = false;

  const exercises: DetailExercise[] = w.exercises
    .map((ex) => {
      const prevMax = histMax[ex.name] ?? 0;
      const completedSets = ex.sets.filter((s) => (s.reps ?? 0) > 0);
      const sets: DetailSet[] = completedSets.map((s, i) => {
        const kg = s.weight ?? 0;
        const reps = s.reps ?? 0;
        const isPR = kg > 0 && kg > prevMax;
        if (isPR && !hasPR) {
          prExercise = ex.name;
          prKg = kg;
          prReps = reps;
          hasPR = true;
        }
        return { set_number: i + 1, weight_kg: kg, reps, is_completed: true, is_pr: isPR };
      });
      const total_volume = sets.reduce((a, s) => a + s.weight_kg * s.reps, 0);
      return { id: ex.id, name: ex.name, emoji: '🏋️', total_volume, sets };
    })
    .filter((ex) => ex.sets.length > 0);

  const totalVolume = exercises.reduce((a, ex) => a + ex.total_volume, 0);
  const totalSets   = exercises.reduce((a, ex) => a + ex.sets.length, 0);
  const durationSecs = w.finishedAt
    ? dayjs(w.finishedAt).diff(started, 'second')
    : 0;

  const diffDays = dayjs().diff(started, 'day');
  const daysAgoLabel =
    diffDays === 0 ? 'today' : diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;

  const detail: WorkoutDetail = {
    id:              w.id,
    date:            started.format('ddd, D MMM'),
    started_at:      started.format('h:mm A'),
    finished_at:     w.finishedAt ? dayjs(w.finishedAt).format('h:mm A') : '',
    duration_secs:   durationSecs,
    total_volume_kg: totalVolume,
    total_sets:      totalSets,
    hasPR,
    prExercise,
    prKg,
    prReps,
    days_ago_label: daysAgoLabel,
    exercises,
  };

  return { detail, isoDate: w.createdAt.toISOString() };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDuration = (s: number) => {
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m` : `${s}s`;
};

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

// ─── Heatmap ──────────────────────────────────────────────────────────────────

const HEAT_COLORS = ['#f0f0f0', '#d1fae5', '#6ee7b7', '#10B981'];

function MonthlyHeatmap({ workoutIsoDates }: { workoutIsoDates: string[] }) {
  const today = dayjs();
  const daysInMonth = today.daysInMonth();
  const workoutDaySet = new Set(workoutIsoDates.map((d) => dayjs(d).format('YYYY-MM-DD')));

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = today.startOf('month').add(i, 'day');
    if (day.isAfter(today, 'day')) return 0;
    return workoutDaySet.has(day.format('YYYY-MM-DD')) ? 3 : 0;
  });

  return (
    <div className="flex gap-[3px] flex-wrap">
      {days.map((intensity, i) => (
        <div
          key={i}
          className="w-[9px] h-[9px] rounded-[2px]"
          style={{ backgroundColor: HEAT_COLORS[intensity] }}
        />
      ))}
    </div>
  );
}

// ─── WorkoutCard ──────────────────────────────────────────────────────────────

function WorkoutCard({
  entry,
  onClick,
  weightUnit,
}: {
  entry: HistoryEntry;
  onClick: () => void;
  weightUnit: 'kg' | 'lbs';
}) {
  const { detail } = entry;
  const shown = detail.exercises.slice(0, 2);
  const extra = detail.exercises.length - 2;

  return (
    <motion.div
      onClick={onClick}
      className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] px-4 py-4 cursor-pointer"
      variants={staggerChild}
      whileTap={press.whileTap}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-bold text-[15px] leading-snug dark:text-white">{detail.date}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {detail.exercises.length} exercise{detail.exercises.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-gray-400">
            <Clock size={13} />
            <span className="text-[12px] font-semibold">{fmtDuration(detail.duration_secs)}</span>
          </div>
          {detail.hasPR && (
            <span className="bg-amber-100 text-amber-700 text-[11px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
              🏆 PR
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-tint-muted flex items-center justify-center">
            <Dumbbell size={13} className="text-tint" />
          </div>
          <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300">
            {formatWeight(detail.total_volume_kg, weightUnit)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-tint-muted flex items-center justify-center">
            <CheckSquare size={13} className="text-tint" />
          </div>
          <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300">
            {detail.total_sets} sets
          </span>
        </div>
      </div>

      {/* Exercise tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {shown.map((ex) => (
          <span
            key={ex.id}
            className="flex items-center gap-1 bg-[#f0fdf4] text-tint text-[12px] font-semibold px-2.5 py-1 rounded-full"
          >
            <span>{ex.emoji}</span>
            <span>{ex.name}</span>
          </span>
        ))}
        {extra > 0 && (
          <span className="bg-gray-100 text-gray-500 text-[12px] font-semibold px-2.5 py-1 rounded-full">
            +{extra} more
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const FILTER_PILLS = ['All', 'This week', 'This month'];

export default function History() {
  usePageTitle('History');
  const { mode, user } = useAuthContext();
  const storeWorkouts = useStore((s) => s.workouts);

  const [dbWorkouts, setDbWorkouts]   = useState<WorkoutWithExercisesAndSets[]>([]);
  const [loading, setLoading]         = useState(mode === 'authenticated');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const { weightUnit } = usePreferences();

  useEffect(() => {
    if (mode !== 'authenticated' || !user?.id) { setLoading(false); return; }
    const minDelay = new Promise<void>((res) => setTimeout(res, 300));
    const dataFetch = getWorkouts(user.id);
    Promise.all([minDelay, dataFetch])
      .then(([, data]) => setDbWorkouts(data))
      .catch((err) => console.error('History: failed to load workouts', err))
      .finally(() => setLoading(false));
  }, [mode, user?.id]);

  // ── Convert to unified HistoryEntry[] ────────────────────────────────────
  const allEntries: HistoryEntry[] =
    mode === 'authenticated'
      ? dbWorkouts.map((w) => dbWorkoutToEntry(w, dbWorkouts))
      : [...storeWorkouts]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .map((w) => storeWorkoutToEntry(w, storeWorkouts));

  // ── Filter ────────────────────────────────────────────────────────────────
  const today        = dayjs();
  const thisWeekStart = today.startOf('week');
  const thisMonthStart = today.startOf('month');

  const filtered = allEntries.filter((e) => {
    const d = dayjs(e.isoDate);
    if (activeFilter === 'This week')  return !d.isBefore(thisWeekStart);
    if (activeFilter === 'This month') return !d.isBefore(thisMonthStart);
    return true;
  });

  // ── Group by week ─────────────────────────────────────────────────────────
  const lastWeekStart = thisWeekStart.subtract(1, 'week');

  type WeekGroup = { label: string; entries: HistoryEntry[]; weekVol: number };
  const groups: WeekGroup[] = [];

  for (const entry of filtered) {
    const d = dayjs(entry.isoDate);
    let label: string;
    if (!d.isBefore(thisWeekStart))  label = 'This week';
    else if (!d.isBefore(lastWeekStart)) label = 'Last week';
    else label = `Week of ${d.startOf('week').format('D MMM')}`;

    const existing = groups.find((g) => g.label === label);
    if (existing) {
      existing.entries.push(entry);
      existing.weekVol += entry.detail.total_volume_kg;
    } else {
      groups.push({ label, entries: [entry], weekVol: entry.detail.total_volume_kg });
    }
  }

  // ── Monthly summary stats ─────────────────────────────────────────────────
  const monthLabel   = today.format('MMMM YYYY');
  const thisMonthEntries = allEntries.filter((e) => dayjs(e.isoDate).isSame(today, 'month'));
  const monthVol     = thisMonthEntries.reduce((a, e) => a + e.detail.total_volume_kg, 0);
  const streak       = computeStreak(allEntries.map((e) => e.isoDate));
  const workoutIsoDates = allEntries.map((e) => e.isoDate);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
    <motion.div
      className="flex flex-col min-h-screen"
      variants={screenEnter}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >

      {/* ── 1. Header ─────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-[#111] px-5 pt-12 pb-0">
        <h1 className="text-[28px] font-black leading-tight tracking-tight mb-4 dark:text-white">
          History
        </h1>

        {/* Filter pills */}
        <div
          className="flex gap-2 overflow-x-auto pb-3"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {FILTER_PILLS.map((pill) => (
            <motion.button
              key={pill}
              onClick={() => setActiveFilter(pill)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
                activeFilter === pill
                  ? 'bg-tint text-white border-tint'
                  : 'bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-[#555] border-gray-200 dark:border-[#333]'
              }`}
              whileTap={press.whileTap}
            >
              {pill}
            </motion.button>
          ))}
        </div>
      </header>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            className="pt-4"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <HistoryScreenSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="flex-1 px-4 pt-4 pb-[90px] flex flex-col gap-5"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >

        {/* ── 2. Monthly Summary Card ───────────────────────────────────────── */}
        <motion.div
          variants={staggerChild}
          className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] p-4"
        >
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            {monthLabel}
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[24px] font-black leading-none text-tint tabular-nums">
                {thisMonthEntries.length}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">sessions</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[24px] font-black leading-none text-gray-900 dark:text-white tabular-nums">
                {weightUnit === 'lbs'
                  ? `${((monthVol * 2.2046) / 1000).toFixed(1)}k`
                  : `${(monthVol / 1000).toFixed(1)}k`}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">{weightUnit} lifted</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[24px] font-black leading-none text-gray-900 dark:text-white tabular-nums flex items-center gap-0.5">
                🔥{streak}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">streak</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-50 dark:border-[#1a1a1a]">
            <p className="text-[10px] text-gray-400 font-semibold mb-2 uppercase tracking-wide">
              Activity
            </p>
            <MonthlyHeatmap workoutIsoDates={workoutIsoDates} />
          </div>
        </motion.div>

        {/* ── 3. Empty state ────────────────────────────────────────────────── */}
        {allEntries.length === 0 && (
          <motion.div
            variants={staggerChild}
            className="bg-white rounded-2xl border border-[#f0f0f0] py-14 flex flex-col items-center gap-2"
          >
            <p className="text-4xl">🏋️</p>
            <p className="font-bold text-gray-700 mt-1">No workouts yet</p>
            <p className="text-sm text-gray-400">Complete your first workout to see history</p>
          </motion.div>
        )}

        {/* ── 4. Workout groups ─────────────────────────────────────────────── */}
        {groups.map((group) => (
          <motion.div key={group.label} variants={staggerChild}>
            {/* Week label row */}
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                {group.label}
              </span>
              <span className="text-[12px] font-bold text-tint">
                {formatWeight(group.weekVol, weightUnit)}
              </span>
            </div>

            {/* Cards */}
            <motion.div
              className="flex flex-col gap-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {group.entries.map((entry) => (
                <WorkoutCard
                  key={entry.detail.id}
                  entry={entry}
                  weightUnit={weightUnit}
                  onClick={() => setSelectedEntry(entry)}
                />
              ))}
            </motion.div>
          </motion.div>
        ))}

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>

    <AnimatePresence>
      {selectedEntry && (
        <WorkoutDetailScreen
          key={selectedEntry.detail.id}
          workout={selectedEntry.detail}
          onBack={() => setSelectedEntry(null)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
