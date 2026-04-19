import { useState, useEffect, useRef, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  X, Clock, Pause, Play, Plus, MoreVertical, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import useStore from '@/store';
import exerciseList from '@/data/exercises';
import { ExerciseSet, ExerciseWithSets } from '@/types/models';
import {
  screenEnter, staggerChild, staggerContainer, checkPunch, rowFlood,
  sheetSlide, overlayFade, press, SPRING,
} from '@/animations/fitnex.variants';
import { useAuthContext } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { getWorkouts } from '@/lib/supabase';

// ─── helpers ────────────────────────────────────────────────────────────────

const fmtTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const getEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('bench') || n.includes('chest') || n.includes('fly'))         return '🏋️';
  if (n.includes('squat') || n.includes('leg')   || n.includes('lunge'))        return '🦵';
  if (n.includes('dead')  || n.includes('row')   || n.includes('pull'))         return '💪';
  if (n.includes('shoulder') || n.includes('lateral') || n.includes('overhead')) return '🔥';
  if (n.includes('curl') || n.includes('tricep') || n.includes('bicep'))        return '💪';
  if (n.includes('plank') || n.includes('crunch') || n.includes('ab'))          return '⚡';
  return '🏋️';
};

// ─── SetRow ─────────────────────────────────────────────────────────────────

type SetRowProps = {
  set: ExerciseSet;
  index: number;
  previous: string | null;
  completed: boolean;
  onToggle: () => void;
};

function SetRow({ set, index, previous, completed, onToggle }: SetRowProps) {
  const [kg,   setKg]   = useState(set.weight?.toString() ?? '');
  const [reps, setReps] = useState(set.reps?.toString()   ?? '');
  const updateSet = useStore((s) => s.updateSet);

  const inputBase = 'flex-1 py-2.5 text-center text-[15px] font-bold rounded-xl outline-none focus:ring-2 focus:ring-tint border transition-colors min-w-0';
  const inputDone = 'bg-[#f0fdf4] dark:bg-[#0d2e22] border-tint/30 text-tint dark:text-[#6ee7b7]';
  const inputIdle = 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-800 dark:text-white';

  return (
    <motion.div
      variants={rowFlood}
      animate={completed ? 'checked' : 'unchecked'}
      initial={false}
      layout
      className="flex items-center gap-2 px-3 py-2"
    >
      {/* # */}
      <span className={`w-7 text-center text-[15px] font-black shrink-0 ${
        completed ? 'text-tint' : 'text-gray-400 dark:text-[#555]'
      }`}>
        {index + 1}
      </span>

      {/* Previous */}
      <div className="w-[80px] shrink-0 px-2 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl text-center text-[13px] font-semibold text-gray-500 dark:text-[#666] truncate">
        {previous ?? '—'}
      </div>

      {/* kg */}
      <input
        type="text"
        inputMode="decimal"
        placeholder="0"
        value={kg}
        onChange={(e) => { const v = e.target.value; if (/^\d*\.?\d*$/.test(v)) setKg(v); }}
        onBlur={() => updateSet(set.id, { weight: parseFloat(kg) || 0 })}
        className={`${inputBase} ${completed ? inputDone : inputIdle}`}
      />

      {/* Reps */}
      <input
        type="text"
        inputMode="numeric"
        placeholder="0"
        value={reps}
        onChange={(e) => { const v = e.target.value; if (/^\d*$/.test(v)) setReps(v); }}
        onBlur={() => updateSet(set.id, { reps: parseInt(reps) || 0 })}
        className={`${inputBase} ${completed ? inputDone : inputIdle}`}
      />

      {/* ✓ */}
      <motion.button
        onClick={onToggle}
        variants={checkPunch}
        animate={completed ? 'checked' : 'unchecked'}
        initial={false}
        className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0 ${
          completed
            ? 'border-tint bg-tint shadow-[0_2px_8px_rgba(16,185,129,0.35)]'
            : 'border-gray-200 dark:border-[#444]'
        }`}
        whileTap={press.whileTap}
      >
        {completed && <Check size={14} className="text-white" strokeWidth={3} />}
      </motion.button>
    </motion.div>
  );
}

// ─── ExerciseCard ────────────────────────────────────────────────────────────

type ExerciseCardProps = {
  exercise: ExerciseWithSets;
  completedSetIds: Set<string>;
  previous: string | null;
  onToggleSet: (setId: string) => void;
  onRemove: () => void;
};

function ExerciseCard({
  exercise, completedSetIds, previous, onToggleSet, onRemove,
}: ExerciseCardProps) {
  const addSet    = useStore((s) => s.addSet);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a]">

      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-[#1a1a1a]">
        <div className="w-10 h-10 rounded-xl bg-tint-muted flex items-center justify-center text-lg shrink-0">
          {getEmoji(exercise.name)}
        </div>
        <p className="font-bold flex-1 text-[16px] leading-snug dark:text-white">{exercise.name}</p>

        {/* Menu */}
        <div className="relative">
          {menuOpen && (
            <div
              className="fixed inset-0 z-[9]"
              onClick={() => setMenuOpen(false)}
            />
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] flex items-center justify-center text-gray-400 relative z-[10] active:bg-gray-50 dark:active:bg-[#222]"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-[#333] shadow-lg z-[10] w-44 overflow-hidden">
              <button
                onClick={() => { onRemove(); setMenuOpen(false); }}
                className="w-full px-4 py-3 text-left text-sm text-red-500 font-semibold active:bg-red-50 dark:active:bg-[#2a1010]"
              >
                Remove exercise
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <span className="w-7 text-center text-[11px] font-bold text-gray-400 dark:text-[#555] tracking-wide shrink-0 uppercase">Set</span>
        <span className="w-[80px] text-center text-[11px] font-bold text-gray-400 dark:text-[#555] tracking-wide shrink-0 uppercase">Previous</span>
        <span className="flex-1 text-center text-[11px] font-bold text-gray-400 dark:text-[#555] tracking-wide uppercase">KG</span>
        <span className="flex-1 text-center text-[11px] font-bold text-gray-400 dark:text-[#555] tracking-wide uppercase">Reps</span>
        <span className="w-9 shrink-0" />
      </div>

      {/* Set rows */}
      <div className="flex flex-col pb-1">
        <AnimatePresence initial={false}>
          {exercise.sets.map((set, i) => (
            <motion.div
              key={set.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto', transition: { ...SPRING.soft } }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
              layout
              style={{ overflow: 'hidden' }}
            >
              <SetRow
                set={set}
                index={i}
                previous={previous}
                completed={completedSetIds.has(set.id)}
                onToggle={() => onToggleSet(set.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add set */}
      <button
        onClick={() => addSet(exercise.id)}
        className="w-full py-3 border-t border-dashed border-gray-200 dark:border-[#333] text-sm font-semibold text-gray-400 dark:text-[#555] flex items-center justify-center gap-1.5 active:bg-gray-50 dark:active:bg-[#1a1a1a] rounded-b-2xl"
      >
        <Plus size={14} />
        Add set
      </button>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function CurrentWorkout() {
  usePageTitle('Workout in progress');
  const navigate       = useNavigate();
  const currentWorkout  = useStore((s) => s.currentWorkout);
  const workouts        = useStore((s) => s.workouts);
  const addExercise     = useStore((s) => s.addExercise);
  const removeExercise  = useStore((s) => s.removeExercise);
  const discardWorkout  = useStore((s) => s.discardWorkout);
  const { mode, user }  = useAuthContext();
  const { restTimerSecs } = usePreferences();

  const [elapsed,    setElapsed]    = useState(0);
  const [isRunning,  setIsRunning]  = useState(true);
  const [completedSetIds, setCompleted] = useState<Set<string>>(new Set());
  const [restSeconds,  setRestSeconds]  = useState(0);
  const [showRest,     setShowRest]     = useState(false);
  const [addExOpen,    setAddExOpen]    = useState(false);
  const [showFinishSheet,  setShowFinishSheet]  = useState(false);
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);
  const [search,       setSearch]       = useState('');
  const [dbStreak,     setDbStreak]     = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const restRef  = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Main timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // Rest timer
  useEffect(() => {
    if (!showRest) { clearInterval(restRef.current); return; }
    restRef.current = setInterval(() => {
      setRestSeconds((s) => {
        if (s <= 1) { setShowRest(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(restRef.current);
  }, [showRest]);

  // Previous values from local Zustand store (guest / fallback)
  const localPreviousMap = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const w of workouts) {
      for (const ex of w.exercises) {
        if (!(ex.name in map)) {
          const last = [...ex.sets].reverse().find((s) => s.weight && s.reps);
          map[ex.name] = last ? `${last.weight} × ${last.reps}` : null;
        }
      }
    }
    return map;
  }, [workouts]);

  // Previous values + streak from Supabase (authenticated users)
  const [dbPreviousMap, setDbPreviousMap] = useState<Record<string, string | null>>({});
  useEffect(() => {
    if (mode !== 'authenticated' || !user) return;
    getWorkouts(user.id).then((dbWorkouts) => {
      const map: Record<string, string | null> = {};
      for (const w of dbWorkouts) {
        for (const ex of w.exercises) {
          if (!(ex.name in map)) {
            const last = [...ex.sets].reverse().find((s) => s.weight_kg && s.reps);
            map[ex.name] = last ? `${last.weight_kg} × ${last.reps}` : null;
          }
        }
      }
      setDbPreviousMap(map);
      // Compute streak from DB workouts
      const days = new Set(dbWorkouts.map((w) => dayjs(w.started_at).format('YYYY-MM-DD')));
      let s = 0; let cur = dayjs();
      while (days.has(cur.format('YYYY-MM-DD'))) { s++; cur = cur.subtract(1, 'day'); }
      if (s === 0) { cur = dayjs().subtract(1, 'day'); while (days.has(cur.format('YYYY-MM-DD'))) { s++; cur = cur.subtract(1, 'day'); } }
      setDbStreak(s);
    }).catch(console.error);
  }, [mode, user]);

  const previousMap = mode === 'authenticated' ? dbPreviousMap : localPreviousMap;

  if (!currentWorkout) return <Navigate to="/" replace />;

  const handleToggleSet = (setId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(setId)) {
        next.delete(setId);
      } else {
        next.add(setId);
        setRestSeconds(restTimerSecs);
        setShowRest(true);
      }
      return next;
    });
  };

  const buildSummaryState = () => {
    const summaryExercises = currentWorkout.exercises.map((ex) => {
      const historyWeights = workouts
        .flatMap((w) => w.exercises)
        .filter((e) => e.name === ex.name)
        .flatMap((e) => e.sets.map((s) => s.weight ?? 0));
      const prevBest = historyWeights.length ? Math.max(...historyWeights) : 0;

      return {
        id: ex.id,
        name: ex.name,
        emoji: getEmoji(ex.name),
        sets: ex.sets
          .filter((s) => completedSetIds.has(s.id))
          .map((s) => ({
            kg: s.weight ?? 0,
            reps: s.reps ?? 0,
            completed: true,
            isPR: (s.weight ?? 0) > prevBest,
          })),
      };
    }).filter((ex) => ex.sets.length > 0);

    // Compute streak for share card: DB users use dbStreak, guests use local store
    const localStreak = (() => {
      const days = new Set(workouts.map((w) => dayjs(w.createdAt).format('YYYY-MM-DD')));
      let s = 0; let cur = dayjs();
      while (days.has(cur.format('YYYY-MM-DD'))) { s++; cur = cur.subtract(1, 'day'); }
      if (s === 0) { cur = dayjs().subtract(1, 'day'); while (days.has(cur.format('YYYY-MM-DD'))) { s++; cur = cur.subtract(1, 'day'); } }
      return s;
    })();

    return {
      date:            dayjs(currentWorkout.createdAt).format('ddd, D MMM'),
      startTime:       dayjs(currentWorkout.createdAt).format('h:mm A'),
      startedAt:       currentWorkout.createdAt instanceof Date
                         ? currentWorkout.createdAt.toISOString()
                         : new Date(currentWorkout.createdAt).toISOString(),
      durationSeconds: elapsed,
      exercises:       summaryExercises,
      streak:          mode === 'authenticated' ? dbStreak : localStreak,
    };
  };

  const handleFinishPress = () => {
    if (currentWorkout.exercises.length === 0) {
      // No exercises at all — show the empty warning sheet
      setShowEmptyWarning(true);
      return;
    }
    const completedCount = currentWorkout.exercises.reduce(
      (n, ex) => n + ex.sets.filter((s) => completedSetIds.has(s.id)).length, 0,
    );
    if (completedCount === 0) {
      setShowEmptyWarning(true);
      return;
    }
    setShowFinishSheet(true);
  };

  const handleConfirmSave = () => {
    const summaryState = buildSummaryState();
    setShowFinishSheet(false);
    setTimeout(() => navigate('/workout/summary', { state: summaryState }), 220);
  };

  const handleDiscardFromSheet = () => {
    setShowFinishSheet(false);
    navigate('/');
    setTimeout(() => discardWorkout(), 300);
  };

  const filtered = exerciseList.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-[#f8f9fa] dark:bg-[#0a0a0a]"
      variants={screenEnter}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-[#1a1a1a] px-4 pt-10 pb-4 sticky top-0 z-20">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[18px] font-black leading-snug dark:text-white">New Workout</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {dayjs().format('ddd, D MMM')}
              {' · '}
              {currentWorkout.exercises.length} exercise{currentWorkout.exercises.length !== 1 ? 's' : ''}
            </p>
          </div>
          <motion.button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center mt-1 active:bg-gray-200 dark:active:bg-[#222]"
            whileTap={press.whileTap}
          >
            <X size={18} className="text-gray-500 dark:text-[#888]" />
          </motion.button>
        </div>
      </header>

      {/* ── Scrollable content ──────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-4 pb-[120px] flex flex-col gap-4">

        {/* ── Duration card ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] px-4 py-4 flex items-center">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-tint-muted flex items-center justify-center shrink-0">
              <Clock size={18} className="text-tint" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Duration</p>
              <p className="text-3xl font-black tabular-nums leading-tight dark:text-white">{fmtTime(elapsed)}</p>
            </div>
          </div>

          {isRunning ? (
            <motion.button
              onClick={() => setIsRunning(false)}
              className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center"
              whileTap={press.whileTap}
            >
              <Pause size={18} className="text-gray-500 dark:text-[#888]" />
            </motion.button>
          ) : (
            <motion.button
              onClick={() => setIsRunning(true)}
              className="w-11 h-11 rounded-xl bg-tint flex items-center justify-center"
              whileTap={press.whileTap}
            >
              <Play size={18} className="text-white translate-x-0.5" fill="white" />
            </motion.button>
          )}
        </div>

        {/* ── Exercises ─────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-[15px] dark:text-white">Exercises</p>
            <motion.button
              onClick={() => setAddExOpen(true)}
              className="flex items-center gap-1.5 border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-tint text-sm font-bold px-4 py-2 rounded-xl"
              whileTap={press.whileTap}
            >
              <Plus size={14} strokeWidth={2.5} />
              Add exercise
            </motion.button>
          </div>

          {currentWorkout.exercises.length === 0 ? (
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] py-14 flex flex-col items-center gap-2">
              <p className="text-3xl">🏋️</p>
              <p className="font-semibold text-gray-500 dark:text-[#888] text-sm mt-1">No exercises yet</p>
              <p className="text-xs text-gray-400 dark:text-[#555]">Tap "Add exercise" to get started</p>
            </div>
          ) : (
            <motion.div
              className="flex flex-col gap-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <AnimatePresence initial={false}>
                {currentWorkout.exercises.map((exercise) => (
                  <motion.div
                    key={exercise.id}
                    variants={staggerChild}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    layout
                  >
                    <ExerciseCard
                      exercise={exercise}
                      completedSetIds={completedSetIds}
                      previous={previousMap[exercise.name] ?? null}
                      onToggleSet={handleToggleSet}
                      onRemove={() => removeExercise(exercise.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* ── Finish button ─────────────────────────────────────────────── */}
        <motion.button
          onClick={handleFinishPress}
          className="w-full bg-tint rounded-2xl py-[18px] flex items-center justify-center gap-2 font-black text-white text-[17px] shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
          whileTap={press.whileTap}
        >
          <Check size={20} strokeWidth={3} />
          Finish Workout
        </motion.button>
      </div>

      {/* ── Rest timer toast ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRest && (
          <motion.div
            className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 pointer-events-none"
            variants={sheetSlide}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="bg-[#111] rounded-2xl px-4 py-3 flex items-center gap-3 w-full max-w-[358px] shadow-2xl pointer-events-auto">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Clock size={15} className="text-tint" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide leading-none mb-0.5">
                  Rest timer
                </p>
                <p className="text-xl font-black tabular-nums text-tint leading-tight">
                  {fmtTime(restSeconds)}
                </p>
              </div>
              <button
                onClick={() => setShowRest(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold px-4 py-2 rounded-xl active:opacity-70"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Finish workout confirmation sheet ──────────────────────────── */}
      <AnimatePresence>
        {showFinishSheet && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              className="absolute inset-0 bg-black/70"
              variants={overlayFade}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setShowFinishSheet(false)}
            />
            <motion.div
              className="relative bg-white dark:bg-[#111] rounded-t-3xl w-full px-5 pt-5 pb-10"
              variants={sheetSlide}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 bg-gray-200 dark:bg-[#333] rounded-full" />
              </div>

              <p className="text-[20px] font-black text-gray-900 dark:text-white mb-1">Finish workout?</p>
              <p className="text-[14px] text-gray-400 font-medium mb-6">
                {completedSetIds.size} set{completedSetIds.size !== 1 ? 's' : ''} completed
                {' · '}
                {Math.floor(elapsed / 60)}m {elapsed % 60}s
              </p>

              <div className="flex flex-col gap-3">
                <motion.button
                  onClick={handleConfirmSave}
                  className="w-full bg-tint text-white font-black text-[16px] py-[17px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.25)]"
                  whileTap={press.whileTap}
                >
                  <Check size={18} strokeWidth={3} />
                  Save workout
                </motion.button>
                <motion.button
                  onClick={handleDiscardFromSheet}
                  className="w-full bg-white dark:bg-[#1a1a1a] text-red-500 font-semibold text-[15px] py-[15px] rounded-2xl border border-gray-100 dark:border-[#333]"
                  whileTap={press.whileTap}
                >
                  Discard workout
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Empty / no-sets warning sheet ───────────────────────────────── */}
      <AnimatePresence>
        {showEmptyWarning && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              className="absolute inset-0 bg-black/70"
              variants={overlayFade}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setShowEmptyWarning(false)}
            />
            <motion.div
              className="relative bg-white dark:bg-[#111] rounded-t-3xl w-full px-5 pt-5 pb-10"
              variants={sheetSlide}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="flex justify-center mb-4">
                <div className="w-10 h-1 bg-gray-200 dark:bg-[#333] rounded-full" />
              </div>
              <p className="text-[20px] font-black text-gray-900 dark:text-white mb-1">
                {currentWorkout.exercises.length === 0 ? 'No exercises added' : 'No sets completed'}
              </p>
              <p className="text-[14px] text-gray-400 font-medium mb-6">
                {currentWorkout.exercises.length === 0
                  ? 'Add at least one exercise before finishing.'
                  : "You haven't completed any sets yet. Finish anyway or keep going?"}
              </p>
              <div className="flex flex-col gap-3">
                <motion.button
                  onClick={() => setShowEmptyWarning(false)}
                  className="w-full bg-tint text-white font-black text-[16px] py-[17px] rounded-2xl"
                  whileTap={press.whileTap}
                >
                  Keep going
                </motion.button>
                {currentWorkout.exercises.length > 0 && (
                  <motion.button
                    onClick={() => {
                      setShowEmptyWarning(false);
                      setTimeout(() => setShowFinishSheet(true), 180);
                    }}
                    className="w-full bg-white dark:bg-[#1a1a1a] text-gray-500 font-semibold text-[15px] py-[15px] rounded-2xl border border-gray-100 dark:border-[#333]"
                    whileTap={press.whileTap}
                  >
                    Finish anyway
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add exercise bottom sheet ────────────────────────────────────── */}
      <AnimatePresence>
        {addExOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center">
            <motion.div
              className="absolute inset-0 bg-black/70"
              variants={overlayFade}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => { setAddExOpen(false); setSearch(''); }}
            />
            <motion.div
              className="relative bg-white dark:bg-[#111] rounded-t-3xl sm:rounded-2xl w-full sm:w-11/12 sm:max-w-md flex flex-col"
              style={{ maxHeight: '88vh' }}
              variants={sheetSlide}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-gray-200 dark:bg-[#333] rounded-full" />
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <p className="text-lg font-bold dark:text-white">Add exercise</p>
                <button
                  onClick={() => { setAddExOpen(false); setSearch(''); }}
                  className="p-2 -mr-2 text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-5 pb-3">
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full py-3 px-4 bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-tint placeholder:text-gray-400 dark:placeholder:text-[#555]"
                />
              </div>

              <motion.div
                className="overflow-y-auto flex-1 px-5 pb-8"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {filtered.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No exercises found</p>
                )}
                {filtered.map((ex) => (
                  <motion.button
                    key={ex.name}
                    variants={staggerChild}
                    onClick={() => { addExercise(ex.name); setAddExOpen(false); setSearch(''); }}
                    className="w-full text-left flex items-center gap-3 py-3 border-b border-gray-50 dark:border-[#1a1a1a] last:border-0 rounded-lg"
                    whileTap={press.whileTap}
                  >
                    <span className="w-9 h-9 rounded-xl bg-tint-muted flex items-center justify-center text-base shrink-0">
                      {getEmoji(ex.name)}
                    </span>
                    <div>
                      <p className="font-semibold text-sm dark:text-white">{ex.name}</p>
                      <p className="text-xs text-gray-400">{ex.muscle}</p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
