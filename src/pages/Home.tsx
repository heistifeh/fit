import { useNavigate, Link } from 'react-router-dom';
import { Bell, Play, ChevronRight, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import useStore from '@/store';
import dayjs from 'dayjs';
import { getWorkoutTotalWeight } from '@/services/workoutService';
import { WorkoutWithExercises } from '@/types/models';
import {
  screenEnter, staggerContainer, staggerChild, press,
} from '@/animations/fitnex.variants';

// ─── helpers ────────────────────────────────────────────────────────────────

const fmtKg = (kg: number) =>
  kg >= 1000 ? `${(kg / 1000).toFixed(1)}k` : String(kg);

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

const getWorkoutEmoji = (workout: WorkoutWithExercises) => {
  const names = workout.exercises.map((e) => e.name.toLowerCase()).join(' ');
  if (names.includes('bench') || names.includes('chest') || names.includes('fly')) return '🏋️';
  if (names.includes('dead') || names.includes('row')  || names.includes('back'))  return '💀';
  if (names.includes('squat') || names.includes('leg') || names.includes('lunge')) return '🦵';
  return '💪';
};

const getWorkoutName = (workout: WorkoutWithExercises) => {
  if (!workout.exercises.length) return 'Empty session';
  if (workout.exercises.length === 1) return workout.exercises[0].name;
  if (workout.exercises.length === 2)
    return `${workout.exercises[0].name} & ${workout.exercises[1].name}`;
  return `${workout.exercises[0].name} +${workout.exercises.length - 1} more`;
};

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ─── component ──────────────────────────────────────────────────────────────

export default function Home() {
  const navigate       = useNavigate();
  const currentWorkout = useStore((s) => s.currentWorkout);
  const startWorkout   = useStore((s) => s.startWorkout);
  const workouts       = useStore((s) => s.workouts);

  const onStart = () => { startWorkout(); navigate('/workout/current'); };

  const totalVolume = workouts.reduce((a, w) => a + getWorkoutTotalWeight(w), 0);
  const streak      = getStreak(workouts);

  const weekStart  = dayjs().startOf('week');
  const weekDays   = Array.from({ length: 7 }, (_, i) => {
    const day        = weekStart.add(i, 'day');
    const isToday    = day.isSame(dayjs(), 'day');
    const isPast     = day.isBefore(dayjs(), 'day');
    const hasWorkout = workouts.some((w) => dayjs(w.createdAt).isSame(day, 'day'));
    const volume     = workouts
      .filter((w) => dayjs(w.createdAt).isSame(day, 'day'))
      .reduce((a, w) => a + getWorkoutTotalWeight(w), 0);
    return { day, isToday, isPast, hasWorkout, volume };
  });

  const maxBarVol = Math.max(...weekDays.map((d) => d.volume), 1);
  const recent    = workouts.slice(0, 3);
  const maxRecent = Math.max(...recent.map((w) => getWorkoutTotalWeight(w)), 1);

  return (
    <motion.div
      className="flex flex-col min-h-screen"
      variants={screenEnter}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      {/* ── 1. Header ───────────────────────────────────────────────────── */}
      <header className="bg-white px-5 pt-12 pb-4 flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 leading-none mb-1">Welcome back,</p>
          <h1 className="text-[28px] font-black leading-tight tracking-tight">Tife 👋</h1>
        </div>
        <motion.button
          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mt-1"
          whileTap={press.whileTap}
        >
          <Bell size={19} className="text-gray-500" />
        </motion.button>
      </header>

      {/* ── scrollable body ─────────────────────────────────────────────── */}
      <motion.div
        className="flex-1 px-4 pt-4 flex flex-col gap-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* ── 2. Stats row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Sessions */}
          <motion.div
            variants={staggerChild}
            className="bg-white rounded-2xl p-4 border border-[#f0f0f0] flex flex-col items-center gap-0.5"
          >
            <span className="text-[28px] font-black leading-none text-tint tabular-nums">
              {workouts.length}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">sessions</span>
          </motion.div>

          {/* Volume */}
          <motion.div
            variants={staggerChild}
            className="bg-white rounded-2xl p-4 border border-[#f0f0f0] flex flex-col items-center gap-0.5"
          >
            <span className="text-[28px] font-black leading-none text-gray-900 tabular-nums">
              {fmtKg(totalVolume)}
              <span className="text-base font-bold">kg</span>
            </span>
            <span className="text-[11px] text-gray-400 font-medium">lifted</span>
          </motion.div>

          {/* Streak */}
          <motion.div
            variants={staggerChild}
            className="bg-white rounded-2xl p-4 border border-[#f0f0f0] flex flex-col items-center gap-0.5"
          >
            <span className="text-[28px] font-black leading-none text-gray-900 tabular-nums flex items-center gap-1">
              {streak}
              {streak >= 2 && <Flame size={18} className="text-orange-400 mb-0.5" />}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">streak</span>
          </motion.div>
        </div>

        {/* ── 3. Weekly day strip ───────────────────────────────────────── */}
        <motion.div
          variants={staggerChild}
          className="bg-white rounded-2xl border border-[#f0f0f0] px-4 py-3"
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

        {/* ── 4. Workout progress chart ─────────────────────────────────── */}
        <motion.div
          variants={staggerChild}
          className="bg-white rounded-2xl border border-[#f0f0f0] p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-[15px]">Workout Progress</p>
            <span className="bg-tint-muted text-tint text-[11px] font-semibold px-3 py-1 rounded-full">
              Weekly
            </span>
          </div>

          <div className="flex items-end gap-1.5 h-16">
            {weekDays.map(({ isToday, volume }, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end" style={{ height: 48 }}>
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isToday ? 'bg-tint' : 'bg-tint-muted'
                    }`}
                    style={{ height: volume > 0 ? Math.max((volume / maxBarVol) * 48, 6) : 4 }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-medium">{DAY_LETTERS[i]}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── 5. Start workout CTA ──────────────────────────────────────── */}
        {currentWorkout ? (
          <motion.div variants={staggerChild}>
            <Link to="/workout/current" className="block">
              <motion.div
                className="w-full bg-amber-500 rounded-2xl px-5 py-[18px] flex items-center gap-4"
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

        {/* ── 6. Recent workouts ────────────────────────────────────────── */}
        {recent.length > 0 && (
          <motion.div variants={staggerChild}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-[15px]">Recent</p>
              <Link to="/" className="text-sm font-semibold text-tint">See all</Link>
            </div>

            <motion.div
              className="flex flex-col gap-2.5"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {recent.map((workout) => {
                const vol      = getWorkoutTotalWeight(workout);
                const progress = (vol / maxRecent) * 100;
                const emoji    = getWorkoutEmoji(workout);
                const name     = getWorkoutName(workout);

                return (
                  <motion.div key={workout.id} variants={staggerChild} whileTap={press.whileTap}>
                    <Link to={`/workout/${workout.id}`} className="block">
                      <div className="bg-white rounded-2xl border border-[#f0f0f0] px-4 py-3.5 flex items-center gap-3 active:opacity-70 transition-opacity">
                        <div className="w-11 h-11 rounded-xl bg-tint-muted flex items-center justify-center text-xl shrink-0">
                          {emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[14px] leading-snug truncate">{name}</p>
                          <p className="text-[12px] text-gray-400 mt-0.5">
                            {vol > 0 ? `${vol.toLocaleString()}kg` : '—'} · {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                          </p>
                          <div className="mt-2 h-[3px] bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-tint rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}

        {workouts.length === 0 && (
          <motion.div variants={staggerChild} className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="text-4xl mb-1">🏋️</div>
            <p className="font-bold text-gray-600">No sessions logged yet</p>
            <p className="text-sm text-gray-400">Hit the button above to start</p>
          </motion.div>
        )}

      </motion.div>
    </motion.div>
  );
}
