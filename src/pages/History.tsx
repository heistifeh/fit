import { useState } from 'react';
import { Clock, Dumbbell, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import {
  screenEnter, staggerContainer, staggerChild, press,
} from '@/animations/fitnex.variants';
import WorkoutDetailScreen, {
  type WorkoutDetail, type DetailExercise, type DetailSet,
} from './WorkoutDetailScreen';

dayjs.extend(isoWeek);

// ─── Types ───────────────────────────────────────────────────────────────────

type MockSet = { kg: number; reps: number };
type MockExercise = { name: string; emoji: string; sets: MockSet[] };
type MockWorkout = {
  id: number;
  date: string;
  startTime: string;
  durationSeconds: number;
  exercises: MockExercise[];
  hasPR: boolean;
  _date: dayjs.Dayjs; // internal for grouping
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const today = dayjs();

function makeWorkout(
  id: number,
  daysAgo: number,
  time: string,
  durSecs: number,
  exercises: MockExercise[],
  hasPR = false,
): MockWorkout {
  const d = today.subtract(daysAgo, 'day');
  return {
    id,
    date: d.format('ddd, D MMM'),
    startTime: time,
    durationSeconds: durSecs,
    exercises,
    hasPR,
    _date: d,
  };
}

const MOCK_WORKOUTS: MockWorkout[] = [
  makeWorkout(1, 0, '7:14 PM', 2520, [
    { name: 'Bench Press',  emoji: '🏋️', sets: [{ kg: 80, reps: 8 }, { kg: 82.5, reps: 6 }, { kg: 85, reps: 5 }] },
    { name: 'Barbell Row',  emoji: '💪', sets: [{ kg: 70, reps: 10 }, { kg: 70, reps: 10 }] },
    { name: 'Overhead Press', emoji: '🔥', sets: [{ kg: 55, reps: 8 }, { kg: 57.5, reps: 6 }] },
  ], true),
  makeWorkout(2, 2, '6:30 PM', 3180, [
    { name: 'Squat',        emoji: '🦵', sets: [{ kg: 100, reps: 5 }, { kg: 105, reps: 5 }, { kg: 107.5, reps: 3 }] },
    { name: 'Leg Press',    emoji: '🦵', sets: [{ kg: 180, reps: 12 }, { kg: 180, reps: 10 }] },
    { name: 'Leg Curl',     emoji: '🦵', sets: [{ kg: 50, reps: 12 }, { kg: 50, reps: 10 }] },
  ]),
  makeWorkout(3, 4, '8:00 AM', 2100, [
    { name: 'Deadlift',     emoji: '💪', sets: [{ kg: 120, reps: 5 }, { kg: 130, reps: 3 }, { kg: 135, reps: 2 }] },
    { name: 'Pull-up',      emoji: '💪', sets: [{ kg: 0, reps: 10 }, { kg: 0, reps: 8 }] },
    { name: 'Cable Row',    emoji: '💪', sets: [{ kg: 60, reps: 12 }, { kg: 62.5, reps: 10 }] },
  ], true),
  makeWorkout(4, 7, '5:45 PM', 2760, [
    { name: 'Bench Press',  emoji: '🏋️', sets: [{ kg: 77.5, reps: 8 }, { kg: 80, reps: 8 }, { kg: 80, reps: 6 }] },
    { name: 'Incline DB',   emoji: '🏋️', sets: [{ kg: 32, reps: 10 }, { kg: 32, reps: 10 }] },
  ]),
  makeWorkout(5, 9, '7:00 PM', 3360, [
    { name: 'Squat',        emoji: '🦵', sets: [{ kg: 100, reps: 5 }, { kg: 100, reps: 5 }, { kg: 100, reps: 5 }] },
    { name: 'Romanian DL',  emoji: '💪', sets: [{ kg: 80, reps: 10 }, { kg: 85, reps: 8 }] },
    { name: 'Leg Extension',emoji: '🦵', sets: [{ kg: 65, reps: 15 }, { kg: 65, reps: 12 }] },
    { name: 'Calf Raise',   emoji: '⚡', sets: [{ kg: 40, reps: 20 }, { kg: 40, reps: 18 }] },
  ]),
  makeWorkout(6, 11, '6:15 PM', 1980, [
    { name: 'Pull-up',      emoji: '💪', sets: [{ kg: 0, reps: 12 }, { kg: 0, reps: 10 }, { kg: 0, reps: 8 }] },
    { name: 'Barbell Row',  emoji: '💪', sets: [{ kg: 65, reps: 10 }, { kg: 67.5, reps: 8 }] },
  ]),
  makeWorkout(7, 13, '8:30 AM', 2880, [
    { name: 'Bench Press',  emoji: '🏋️', sets: [{ kg: 75, reps: 8 }, { kg: 77.5, reps: 8 }, { kg: 77.5, reps: 7 }] },
    { name: 'Dips',         emoji: '🏋️', sets: [{ kg: 0, reps: 12 }, { kg: 0, reps: 10 }] },
    { name: 'Tricep Press', emoji: '💪', sets: [{ kg: 35, reps: 12 }, { kg: 35, reps: 10 }] },
  ]),
  makeWorkout(8, 14, '5:30 PM', 2400, [
    { name: 'Deadlift',     emoji: '💪', sets: [{ kg: 115, reps: 5 }, { kg: 120, reps: 5 }, { kg: 125, reps: 3 }] },
    { name: 'Lat Pulldown', emoji: '💪', sets: [{ kg: 70, reps: 12 }, { kg: 72.5, reps: 10 }] },
  ]),
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDuration = (s: number) => `${Math.round(s / 60)}m`;

const totalVolume = (w: MockWorkout) =>
  w.exercises.flatMap((e) => e.sets).reduce((a, s) => a + s.kg * s.reps, 0);

const totalSets = (w: MockWorkout) =>
  w.exercises.reduce((a, e) => a + e.sets.length, 0);

// Seed-based pseudo-random for stable heatmap values
const seededRand = (seed: number) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

// ─── Adapter: MockWorkout → WorkoutDetail ─────────────────────────────────────

function toWorkoutDetail(w: MockWorkout): WorkoutDetail {
  // All workouts with a higher id are older (id=1 is newest, id=8 is oldest)
  const olderWorkouts = MOCK_WORKOUTS.filter((o) => o.id > w.id);

  // Best weight per exercise name across older workouts
  const histMax: Record<string, number> = {};
  for (const old of olderWorkouts) {
    for (const ex of old.exercises) {
      const max = Math.max(...ex.sets.map((s) => s.kg));
      histMax[ex.name] = Math.max(histMax[ex.name] ?? 0, max);
    }
  }

  // Build exercises with PR flags
  let prExercise: string | undefined;
  let prKg: number | undefined;
  let prReps: number | undefined;

  const exercises: DetailExercise[] = w.exercises.map((ex, exIdx) => {
    const prevMax = histMax[ex.name] ?? 0;
    const exerciseVolume = ex.sets.reduce((a, s) => a + s.kg * s.reps, 0);

    const sets: DetailSet[] = ex.sets.map((s, i) => {
      const isPR = s.kg > 0 && s.kg > prevMax;
      if (isPR && prExercise === undefined) {
        prExercise = ex.name;
        prKg = s.kg;
        prReps = s.reps;
      }
      return {
        set_number: i + 1,
        weight_kg: s.kg,
        reps: s.reps,
        is_completed: true,
        is_pr: isPR,
      };
    });

    return {
      id: `${w.id}-${exIdx}`,
      name: ex.name,
      emoji: ex.emoji,
      total_volume: exerciseVolume,
      sets,
    };
  });

  // Parse start time (e.g. "7:14 PM")
  const [timePart, meridiem] = w.startTime.split(' ');
  const [hoursStr, minutesStr] = timePart.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  const startDayjs = w._date.hour(hours).minute(minutes).second(0);
  const finishDayjs = startDayjs.add(w.durationSeconds, 'second');

  // Days ago label
  const diffDays = today.diff(w._date, 'day');
  const daysAgoLabel =
    diffDays === 0 ? 'today' :
    diffDays === 1 ? 'yesterday' :
    `${diffDays} days ago`;

  return {
    id: String(w.id),
    date: w.date,
    started_at: w.startTime,
    finished_at: finishDayjs.format('h:mm A'),
    duration_secs: w.durationSeconds,
    total_volume_kg: totalVolume(w),
    total_sets: totalSets(w),
    hasPR: w.hasPR,
    prExercise,
    prKg,
    prReps,
    days_ago_label: daysAgoLabel,
    exercises,
  };
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

const HEAT_COLORS = ['#f0f0f0', '#d1fae5', '#6ee7b7', '#10B981'];

function MonthlyHeatmap() {
  const daysInMonth = today.daysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = today.startOf('month').add(i, 'day');
    const isFuture = day.isAfter(today, 'day');
    const hasWorkout = MOCK_WORKOUTS.some((w) => w._date.isSame(day, 'day'));
    if (isFuture) return 0;
    if (hasWorkout) return Math.floor(seededRand(i) * 3) + 1;
    return seededRand(i + 100) > 0.72 ? Math.floor(seededRand(i + 200) * 2) + 1 : 0;
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

function WorkoutCard({ workout, onClick }: { workout: MockWorkout; onClick: () => void }) {
  const vol  = totalVolume(workout);
  const sets = totalSets(workout);
  const shown = workout.exercises.slice(0, 2);
  const extra = workout.exercises.length - 2;

  return (
    <motion.div
      onClick={onClick}
      className="bg-white rounded-2xl border border-[#f0f0f0] px-4 py-4 cursor-pointer"
      variants={staggerChild}
      whileTap={press.whileTap}
    >

      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-bold text-[15px] leading-snug">
            {workout.date}
          </p>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-gray-400">
            <Clock size={13} />
            <span className="text-[12px] font-semibold">{fmtDuration(workout.durationSeconds)}</span>
          </div>
          {workout.hasPR && (
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
          <span className="text-[13px] font-bold text-gray-700">
            {vol.toLocaleString()} kg
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-tint-muted flex items-center justify-center">
            <CheckSquare size={13} className="text-tint" />
          </div>
          <span className="text-[13px] font-bold text-gray-700">
            {sets} sets
          </span>
        </div>
      </div>

      {/* Exercise tags */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {shown.map((ex) => (
          <span
            key={ex.name}
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

const FILTER_PILLS = ['All', 'This week', 'This month', 'Push', 'Pull', 'Legs'];

export default function History() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedWorkout, setSelectedWorkout] = useState<MockWorkout | null>(null);

  // ── Group workouts by week ────────────────────────────────────────────────
  const thisWeekStart = today.startOf('week');
  const lastWeekStart = thisWeekStart.subtract(1, 'week');

  type WeekGroup = { label: string; workouts: MockWorkout[]; weekStart: dayjs.Dayjs };
  const groups: WeekGroup[] = [];

  for (const workout of MOCK_WORKOUTS) {
    const d = workout._date;
    let label: string;
    let weekStart: dayjs.Dayjs;

    if (!d.isBefore(thisWeekStart)) {
      label = 'This week';
      weekStart = thisWeekStart;
    } else if (!d.isBefore(lastWeekStart)) {
      label = 'Last week';
      weekStart = lastWeekStart;
    } else {
      weekStart = d.startOf('week');
      label = `Week of ${weekStart.format('D MMM')}`;
    }

    const existing = groups.find((g) => g.label === label);
    if (existing) {
      existing.workouts.push(workout);
    } else {
      groups.push({ label, workouts: [workout], weekStart });
    }
  }

  // ── Monthly summary stats ─────────────────────────────────────────────────
  const monthLabel  = today.format('MMMM YYYY');
  const thisMonth   = MOCK_WORKOUTS.filter((w) => w._date.isSame(today, 'month'));
  const monthVol    = thisMonth.reduce((a, w) => a + totalVolume(w), 0);
  const streak      = 4; // hardcoded mock streak

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
      <header className="bg-white px-5 pt-12 pb-0">
        <h1 className="text-[28px] font-black leading-tight tracking-tight mb-4">History</h1>

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
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
              whileTap={press.whileTap}
            >
              {pill}
            </motion.button>
          ))}
        </div>
      </header>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <motion.div
        className="flex-1 px-4 pt-4 pb-[90px] flex flex-col gap-5"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >

        {/* ── 2. Monthly Summary Card ───────────────────────────────────────── */}
        <motion.div
          variants={staggerChild}
          className="bg-white rounded-2xl border border-[#f0f0f0] p-4"
        >
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            {monthLabel}
          </p>

          {/* 3-stat grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[24px] font-black leading-none text-tint tabular-nums">
                {thisMonth.length}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">sessions</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[24px] font-black leading-none text-gray-900 tabular-nums">
                {(monthVol / 1000).toFixed(1)}
                <span className="text-sm font-bold">k</span>
              </span>
              <span className="text-[11px] text-gray-400 font-medium">kg lifted</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[24px] font-black leading-none text-gray-900 tabular-nums flex items-center gap-0.5">
                🔥{streak}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">streak</span>
            </div>
          </div>

          {/* Activity heatmap */}
          <div className="pt-2 border-t border-gray-50">
            <p className="text-[10px] text-gray-400 font-semibold mb-2 uppercase tracking-wide">
              Activity
            </p>
            <MonthlyHeatmap />
          </div>
        </motion.div>

        {/* ── 3. Workout groups ─────────────────────────────────────────────── */}
        {groups.map((group) => {
          const groupVol = group.workouts.reduce((a, w) => a + totalVolume(w), 0);
          return (
            <motion.div key={group.label} variants={staggerChild}>
              {/* Week label row */}
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  {group.label}
                </span>
                <span className="text-[12px] font-bold text-tint">
                  {groupVol.toLocaleString()} kg
                </span>
              </div>

              {/* Cards */}
              <motion.div
                className="flex flex-col gap-3"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {group.workouts.map((w) => (
                  <WorkoutCard key={w.id} workout={w} onClick={() => setSelectedWorkout(w)} />
                ))}
              </motion.div>
            </motion.div>
          );
        })}

      </motion.div>
    </motion.div>

    <AnimatePresence>
      {selectedWorkout && (
        <WorkoutDetailScreen
          workout={toWorkoutDetail(selectedWorkout)}
          onBack={() => setSelectedWorkout(null)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
