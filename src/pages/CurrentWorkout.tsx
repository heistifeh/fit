import { useState, useEffect, useRef, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  X, Clock, Pause, Play, Plus, MoreVertical, Check, Dumbbell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import useStore from '@/store';
import exerciseList from '@/data/exercises';
import { ExerciseSet, ExerciseWithSets } from '@/types/models';
import {
  screenEnter, staggerChild, staggerContainer, rowFlood,
  sheetSlide, overlayFade, press, SPRING,
} from '@/animations/fitnex.variants';
import { useAuthContext } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { getWorkouts } from '@/lib/supabase';
import { calculateStreak } from '@/utils/streak';
import RestTimerPopup from '@/components/RestTimerPopup';
import ExerciseIcon from '@/components/ExerciseIcon';
import { getMuscleFromName } from '@/utils/exerciseIcon';

// ─── helpers ────────────────────────────────────────────────────────────────

const fmtTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// ─── SetRow ─────────────────────────────────────────────────────────────────

type PrevData = { weight: string; reps: string } | null;

type SetRowProps = {
  set: ExerciseSet;
  index: number;
  prevWeight: string | null;
  prevReps: string | null;
  completed: boolean;
  onToggle: () => void;
  isFirstIncomplete: boolean;
  showHint: boolean;
  canDelete: boolean;
  onRemove: () => void;
  darkMode: boolean;
};

function SetRow({
  set, index, prevWeight, prevReps, completed, onToggle,
  isFirstIncomplete, showHint, canDelete, onRemove, darkMode,
}: SetRowProps) {
  const [kg,   setKg]   = useState(set.weight?.toString() ?? '');
  const [reps, setReps] = useState(set.reps?.toString()   ?? '');
  const updateSet = useStore((s) => s.updateSet);

  const inputBase = 'set-input flex-1 py-2.5 text-center text-[15px] font-bold rounded-xl outline-none focus:ring-2 focus:ring-tint border transition-colors min-w-0';
  const inputDone = 'bg-[#d1fae5] dark:bg-[#064e3b] border-tint/30 text-tint dark:text-[#6ee7b7]';
  const inputIdle = 'bg-[#f8f9fa] dark:bg-[#222] border-[#e5e7eb] dark:border-[#2a2a2a] text-gray-800 dark:text-white';

  return (
    <>
      <motion.div
        variants={rowFlood}
        animate={completed ? 'checked' : 'unchecked'}
        initial={false}
        layout
        className="flex items-center gap-2 px-3 py-2"
      >
        {/* Delete button or fixed-width spacer for alignment */}
        {canDelete ? (
          <button
            onClick={onRemove}
            style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'none', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0,
              WebkitTapHighlightColor: 'transparent', flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke={darkMode ? '#555' : '#d1d5db'} strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        ) : (
          <div style={{ width: 24, flexShrink: 0 }} />
        )}

        {/* # */}
        <span className={`w-7 text-center text-[15px] font-black shrink-0 ${
          completed ? 'text-tint' : 'text-gray-400 dark:text-[#444]'
        }`}>
          {index + 1}
        </span>

        {/* kg */}
        <input
          type="text"
          inputMode="decimal"
          placeholder={prevWeight ?? '0'}
          value={kg}
          onChange={(e) => { const v = e.target.value; if (/^\d*\.?\d*$/.test(v)) setKg(v); }}
          onBlur={() => updateSet(set.id, { weight: parseFloat(kg) || 0 })}
          className={`${inputBase} ${completed ? inputDone : inputIdle}`}
        />

        {/* Reps */}
        <input
          type="text"
          inputMode="numeric"
          placeholder={prevReps ?? '0'}
          value={reps}
          onChange={(e) => { const v = e.target.value; if (/^\d*$/.test(v)) setReps(v); }}
          onBlur={() => updateSet(set.id, { reps: parseInt(reps) || 0 })}
          className={`${inputBase} ${completed ? inputDone : inputIdle}`}
        />

        {/* ✓ — completion button, always visible */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {/* Pulse ring on first uncompleted set to draw attention */}
          {isFirstIncomplete && !completed && (
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: -4, borderRadius: 14,
                border: '2px solid #10B981', pointerEvents: 'none',
              }}
            />
          )}
          <motion.button
            onClick={onToggle}
            whileTap={press.whileTap}
            className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all duration-150 ${
              completed
                ? 'bg-tint shadow-[0_2px_8px_rgba(16,185,129,0.35)]'
                : 'bg-white dark:bg-[#222] border-2 border-[#e5e7eb] dark:border-[#333]'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={completed ? 'white' : '#9ca3af'}
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.button>
        </div>
      </motion.div>

      {/* One-time hint: shown below set 1 until first completion */}
      <AnimatePresence>
        {index === 0 && showHint && !completed && (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-tint text-center font-semibold"
            style={{ fontSize: 11, padding: '2px 12px 8px', letterSpacing: '0.01em' }}
          >
            Tap ✓ when you finish a set
          </motion.p>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── ExerciseCard ────────────────────────────────────────────────────────────

type ExerciseCardProps = {
  exercise: ExerciseWithSets;
  completedSetIds: Set<string>;
  prevData: PrevData;
  onToggleSet: (setId: string) => void;
  onRemoveSet: (setId: string) => void;
  onRemove: () => void;
  showHint: boolean;
  darkMode: boolean;
};

function ExerciseCard({
  exercise, completedSetIds, prevData, onToggleSet, onRemoveSet, onRemove, showHint, darkMode,
}: ExerciseCardProps) {
  const addSet = useStore((s) => s.addSet);
  const [menuOpen, setMenuOpen] = useState(false);

  const canDelete = exercise.sets.length > 1;
  const firstIncompleteIdx = exercise.sets.findIndex((s) => !completedSetIds.has(s.id));

  return (
    <div className="bg-white dark:bg-[#161616] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a]">

      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-[#1a1a1a]">
        <ExerciseIcon muscleGroup={getMuscleFromName(exercise.name)} size={40} darkMode={darkMode} />
        <p className="font-bold flex-1 text-[16px] leading-snug dark:text-white">{exercise.name}</p>

        {/* Menu */}
        <div className="relative">
          {menuOpen && (
            <div className="fixed inset-0 z-[9]" onClick={() => setMenuOpen(false)} />
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#222] flex items-center justify-center text-gray-400 relative z-[10] active:bg-gray-50 dark:active:bg-[#2a2a2a]"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#222] rounded-xl border border-gray-100 dark:border-[#2a2a2a] shadow-lg z-[10] w-44 overflow-hidden">
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

      {/* Table header — SET | KG | REPS | ✓ */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <div style={{ width: 24, flexShrink: 0 }} />
        <span className="w-7 text-center text-[11px] font-bold text-gray-400 dark:text-[#444] tracking-wide shrink-0 uppercase">Set</span>
        <span className="flex-1 text-center text-[11px] font-bold text-gray-400 dark:text-[#444] tracking-wide uppercase">KG</span>
        <span className="flex-1 text-center text-[11px] font-bold text-gray-400 dark:text-[#444] tracking-wide uppercase">Reps</span>
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
              exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.2, ease: 'easeOut' } }}
              layout
              style={{ overflow: 'hidden' }}
            >
              <SetRow
                set={set}
                index={i}
                prevWeight={prevData?.weight ?? null}
                prevReps={prevData?.reps ?? null}
                completed={completedSetIds.has(set.id)}
                onToggle={() => onToggleSet(set.id)}
                isFirstIncomplete={i === firstIncompleteIdx}
                showHint={showHint}
                canDelete={canDelete}
                onRemove={() => onRemoveSet(set.id)}
                darkMode={darkMode}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add set */}
      <button
        onClick={() => addSet(exercise.id)}
        className="w-full py-3 border-t border-dashed border-gray-200 dark:border-[#222] text-sm font-semibold text-gray-400 dark:text-[#444] flex items-center justify-center gap-1.5 active:bg-gray-50 dark:active:bg-[#1e1e1e] rounded-b-2xl"
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
  const removeSet       = useStore((s) => s.removeSet);
  const discardWorkout  = useStore((s) => s.discardWorkout);
  const { mode, user }  = useAuthContext();
  const { restTimerSecs, darkMode } = usePreferences();

  // Phase: 'setup' = no timer, add exercises; 'active' = timer running
  const [phase,        setPhase]       = useState<'setup' | 'active'>('setup');
  const [elapsed,    setElapsed]    = useState(0);
  const [isRunning,  setIsRunning]  = useState(false); // timer off until 'active'
  const [completedSetIds, setCompleted] = useState<Set<string>>(new Set());
  // Persisted hint: once user completes their first set, never show the hint again
  const [hasCompletedASet, setHasCompletedASet] = useState(
    () => localStorage.getItem('fitnex_hint_seen') === 'true',
  );
  const [showRestTimer,    setShowRestTimer]    = useState(false);
  const [restTimerContext, setRestTimerContext] = useState<{
    exerciseName: string; setNumber: number; nextSetNumber: number;
  } | null>(null);
  const [addExOpen,    setAddExOpen]    = useState(false);
  const [showFinishSheet,  setShowFinishSheet]  = useState(false);
  const [showDiscardSheet, setShowDiscardSheet] = useState(false);
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);
  const [search,       setSearch]       = useState('');
  const [dbStreak,     setDbStreak]     = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Main timer — only runs when isRunning (set to true on Begin session)
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // Previous values from local Zustand store (guest / fallback)
  const localPreviousMap = useMemo(() => {
    const map: Record<string, PrevData> = {};
    for (const w of workouts) {
      for (const ex of w.exercises) {
        if (!(ex.name in map)) {
          const last = [...ex.sets].reverse().find((s) => s.weight && s.reps);
          map[ex.name] = last ? { weight: String(last.weight), reps: String(last.reps) } : null;
        }
      }
    }
    return map;
  }, [workouts]);

  // Previous values + streak from Supabase (authenticated users)
  const [dbPreviousMap, setDbPreviousMap] = useState<Record<string, PrevData>>({});
  useEffect(() => {
    if (mode !== 'authenticated' || !user) return;
    getWorkouts(user.id).then((dbWorkouts) => {
      const map: Record<string, PrevData> = {};
      for (const w of dbWorkouts) {
        for (const ex of w.exercises) {
          if (!(ex.name in map)) {
            const last = [...ex.sets].reverse().find((s) => s.weight_kg && s.reps);
            map[ex.name] = last ? { weight: String(last.weight_kg), reps: String(last.reps) } : null;
          }
        }
      }
      setDbPreviousMap(map);
      setDbStreak(calculateStreak(dbWorkouts.map((w) => w.started_at)));
    }).catch(console.error);
  }, [mode, user]);

  const previousMap = mode === 'authenticated' ? dbPreviousMap : localPreviousMap;

  if (!currentWorkout) return <Navigate to="/" replace />;

  // ── Phase handlers ──────────────────────────────────────────────────────────

  const handleClose = () => {
    if (phase === 'setup') {
      // Nothing logged yet — go straight home and discard
      navigate('/');
      setTimeout(() => discardWorkout(), 300);
    } else {
      // Active phase — confirm before discarding
      setShowDiscardSheet(true);
    }
  };

  const handleBeginSession = () => {
    setPhase('active');
    setIsRunning(true);
  };

  // ── Active phase handlers ───────────────────────────────────────────────────

  const handleRemoveSet = (exerciseId: string, setId: string) => {
    removeSet(exerciseId, setId);
    setCompleted((prev) => {
      const next = new Set(prev);
      next.delete(setId);
      return next;
    });
  };

  const handleToggleSet = (setId: string) => {
    const isCompleting = !completedSetIds.has(setId);

    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(setId) ? next.delete(setId) : next.add(setId);
      return next;
    });

    if (isCompleting) {
      for (const ex of currentWorkout.exercises) {
        const idx = ex.sets.findIndex((s) => s.id === setId);
        if (idx !== -1) {
          setRestTimerContext({ exerciseName: ex.name, setNumber: idx + 1, nextSetNumber: idx + 2 });
          setShowRestTimer(true);
          break;
        }
      }
      if (!hasCompletedASet) {
        setHasCompletedASet(true);
        localStorage.setItem('fitnex_hint_seen', 'true');
      }
    }
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
        emoji: '',
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

    const localStreak = calculateStreak(workouts.map((w) => w.createdAt.toISOString()));

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
    setShowDiscardSheet(false);
    navigate('/');
    setTimeout(() => discardWorkout(), 300);
  };

  const filtered = exerciseList.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const hasExercises = currentWorkout.exercises.length > 0;

  // ── Shared header ───────────────────────────────────────────────────────────

  const header = (
    <header className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-[#1a1a1a] px-4 pt-10 pb-4 sticky top-0 z-20">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[18px] font-black leading-snug dark:text-white">New Workout</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {dayjs().format('ddd, D MMM')}
            {phase === 'active' && (
              <>
                {' · '}
                {completedSetIds.size} set{completedSetIds.size !== 1 ? 's' : ''} completed
              </>
            )}
          </p>
        </div>
        <motion.button
          onClick={handleClose}
          className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#222] flex items-center justify-center mt-1 active:bg-gray-200 dark:active:bg-[#2a2a2a]"
          whileTap={press.whileTap}
        >
          <X size={18} className="text-gray-500 dark:text-[#888]" />
        </motion.button>
      </div>
    </header>
  );

  // ── Add exercise sheet (shared between both phases) ─────────────────────────

  const addExSheet = (
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
            className="relative bg-white dark:bg-[#161616] rounded-t-3xl sm:rounded-2xl w-full sm:w-11/12 sm:max-w-md flex flex-col overflow-hidden min-h-[75dvh] sm:min-h-0"
            style={{ maxHeight: '88vh' }}
            variants={sheetSlide}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div style={{ width: 40, height: 5, borderRadius: 3, background: darkMode ? '#333' : '#e5e7eb' }} />
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
                className="w-full py-3 px-4 bg-gray-100 dark:bg-[#222] text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-tint placeholder:text-gray-400 dark:placeholder:text-[#555]"
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
                  className="w-full text-left flex items-center gap-3 py-3 border-b border-gray-50 dark:border-[#222] last:border-0 rounded-lg"
                  whileTap={press.whileTap}
                >
                  <ExerciseIcon muscleGroup={ex.muscle} size={36} darkMode={darkMode} />
                  <div>
                    <p className="font-semibold text-sm dark:text-white">{ex.name}</p>
                    <p className="text-xs text-gray-400">{ex.muscle}</p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(to bottom, transparent, ${darkMode ? 'rgba(22,22,22,0.95)' : 'rgba(255,255,255,0.95)'})`, pointerEvents: 'none' }} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-[#f8f9fa] dark:bg-[#0a0a0a]"
      variants={screenEnter}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      {header}

      {/* ── Phase content ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* ── SETUP PHASE ─────────────────────────────────────────────────── */}
        {phase === 'setup' && (
          <motion.div
            key="setup"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
          >
            <div className="flex-1 px-4 pt-4 pb-[160px] flex flex-col gap-3">

              {!hasExercises ? (
                /* Empty state — centered */
                <div className="flex-1 flex flex-col items-center justify-center gap-5 py-12">
                  <Dumbbell size={52} color="#d1d5db" />
                  <div className="text-center">
                    <p className="font-bold text-[17px] dark:text-white mb-1">Add your first exercise</p>
                    <p className="text-sm text-gray-400">Search from 51 exercises or create your own</p>
                  </div>
                  <motion.button
                    onClick={() => setAddExOpen(true)}
                    className="flex items-center gap-2 bg-tint text-white font-bold text-[15px] px-6 py-3.5 rounded-2xl shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
                    whileTap={press.whileTap}
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    Add exercise
                  </motion.button>
                </div>
              ) : (
                /* Exercise list in setup mode (simple — no sets UI) */
                <>
                  <AnimatePresence initial={false}>
                    {currentWorkout.exercises.map((ex) => (
                      <motion.div
                        key={ex.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0, transition: SPRING.soft }}
                        exit={{ opacity: 0, x: -20, transition: { duration: 0.18 } }}
                        layout
                      >
                        <div className="bg-white dark:bg-[#161616] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] px-4 py-3.5 flex items-center gap-3">
                          <ExerciseIcon muscleGroup={getMuscleFromName(ex.name)} size={40} darkMode={darkMode} />
                          <p className="font-bold flex-1 text-[15px] dark:text-white">{ex.name}</p>
                          <button
                            onClick={() => removeExercise(ex.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 dark:text-[#555] active:bg-gray-100 dark:active:bg-[#1a1a1a]"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Add more exercises button */}
                  <motion.button
                    onClick={() => setAddExOpen(true)}
                    className="flex items-center justify-center gap-2 border border-dashed border-gray-300 dark:border-[#333] text-gray-500 dark:text-[#666] font-semibold text-[14px] py-3.5 rounded-2xl"
                    whileTap={press.whileTap}
                  >
                    <Plus size={16} strokeWidth={2.5} />
                    Add exercise
                  </motion.button>
                </>
              )}
            </div>

            {/* Fixed bottom CTA */}
            <div className="fixed bottom-0 inset-x-0 px-4 pb-8 pt-3 bg-[#f8f9fa] dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-[#1a1a1a]">
              <p className="text-center text-[12px] text-gray-400 font-medium mb-3">
                Timer starts when you begin your session
              </p>
              <motion.button
                onClick={handleBeginSession}
                disabled={!hasExercises}
                className="w-full rounded-2xl py-[18px] flex items-center justify-center gap-2 font-black text-[17px] transition-colors"
                style={{
                  background: hasExercises ? '#10B981' : '#e5e7eb',
                  color: hasExercises ? '#fff' : '#9ca3af',
                  boxShadow: hasExercises ? '0 4px 20px rgba(16,185,129,0.3)' : 'none',
                  cursor: hasExercises ? 'pointer' : 'not-allowed',
                }}
                whileTap={hasExercises ? press.whileTap : {}}
              >
                <Play size={20} fill="currentColor" className="translate-x-0.5" />
                Begin session
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── ACTIVE PHASE ────────────────────────────────────────────────── */}
        {phase === 'active' && (
          <motion.div
            key="active"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.22, ease: 'easeOut' } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <div className="flex-1 px-4 pt-4 pb-[120px] flex flex-col gap-4">

              {/* ── Session time card ────────────────────────────────────── */}
              <div className="bg-white dark:bg-[#161616] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] px-4 py-4 flex items-center">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-tint-muted flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-tint" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide leading-none mb-1">
                      Session time
                    </p>
                    <p className="text-3xl font-black tabular-nums leading-tight dark:text-white">
                      {fmtTime(elapsed)}
                    </p>
                  </div>
                </div>

                {isRunning ? (
                  <motion.button
                    onClick={() => setIsRunning(false)}
                    className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-[#222] flex items-center justify-center"
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

              {/* ── Exercises ────────────────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-[15px] dark:text-white">Exercises</p>
                  <motion.button
                    onClick={() => setAddExOpen(true)}
                    className="flex items-center gap-1.5 border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#222] text-tint text-sm font-bold px-4 py-2 rounded-xl"
                    whileTap={press.whileTap}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Add exercise
                  </motion.button>
                </div>

                {currentWorkout.exercises.length === 0 ? (
                  <div className="bg-white dark:bg-[#161616] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] py-14 flex flex-col items-center gap-2">
                    <Dumbbell size={32} color="#9ca3af" />
                    <p className="font-semibold text-gray-500 dark:text-[#888] text-sm mt-1">No exercises</p>
                    <p className="text-xs text-gray-400 dark:text-[#555]">Tap "Add exercise" to continue</p>
                  </div>
                ) : (
                  <motion.div
                    className="flex flex-col gap-3"
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                  >
                    <AnimatePresence initial={false}>
                      {currentWorkout.exercises.map((exercise, exerciseIndex) => (
                        <motion.div
                          key={exercise.id}
                          variants={staggerChild}
                          exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                          layout
                        >
                          <ExerciseCard
                            exercise={exercise}
                            completedSetIds={completedSetIds}
                            prevData={previousMap[exercise.name] ?? null}
                            onToggleSet={handleToggleSet}
                            onRemoveSet={(setId) => handleRemoveSet(exercise.id, setId)}
                            onRemove={() => removeExercise(exercise.id)}
                            showHint={!hasCompletedASet && exerciseIndex === 0}
                            darkMode={darkMode}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>

              {/* ── Finish button ─────────────────────────────────────────── */}
              <motion.button
                onClick={handleFinishPress}
                className="w-full bg-tint rounded-2xl py-[18px] flex items-center justify-center gap-2 font-black text-white text-[17px] shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
                whileTap={press.whileTap}
              >
                <Check size={20} strokeWidth={3} />
                Finish Workout
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Finish workout confirmation sheet ────────────────────────────────── */}
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
              className="relative bg-white dark:bg-[#161616] rounded-t-3xl w-full px-5 pt-5 pb-10"
              style={{ minHeight: '75dvh' }}
              variants={sheetSlide}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div style={{ width: 40, height: 5, borderRadius: 3, background: darkMode ? '#333' : '#e5e7eb', margin: '0 auto 16px' }} />

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
                  className="w-full bg-white dark:bg-[#222] text-red-500 font-semibold text-[15px] py-[15px] rounded-2xl border border-gray-100 dark:border-[#2a2a2a]"
                  whileTap={press.whileTap}
                >
                  Discard workout
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Discard confirmation sheet (active phase X button) ───────────────── */}
      <AnimatePresence>
        {showDiscardSheet && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              className="absolute inset-0 bg-black/70"
              variants={overlayFade}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setShowDiscardSheet(false)}
            />
            <motion.div
              className="relative bg-white dark:bg-[#161616] rounded-t-3xl w-full px-5 pt-5 pb-10"
              style={{ minHeight: '75dvh' }}
              variants={sheetSlide}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div style={{ width: 40, height: 5, borderRadius: 3, background: darkMode ? '#333' : '#e5e7eb', margin: '0 auto 16px' }} />

              <p className="text-[20px] font-black text-gray-900 dark:text-white mb-1">Discard workout?</p>
              <p className="text-[14px] text-gray-400 font-medium mb-6">
                Your progress won't be saved.
              </p>

              <div className="flex flex-col gap-3">
                <motion.button
                  onClick={() => setShowDiscardSheet(false)}
                  className="w-full bg-tint text-white font-black text-[16px] py-[17px] rounded-2xl shadow-[0_4px_20px_rgba(16,185,129,0.25)]"
                  whileTap={press.whileTap}
                >
                  Keep going
                </motion.button>
                <motion.button
                  onClick={handleDiscardFromSheet}
                  className="w-full bg-white dark:bg-[#222] text-red-500 font-semibold text-[15px] py-[15px] rounded-2xl border border-gray-100 dark:border-[#2a2a2a]"
                  whileTap={press.whileTap}
                >
                  Discard workout
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Empty / no-sets warning sheet ────────────────────────────────────── */}
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
              className="relative bg-white dark:bg-[#161616] rounded-t-3xl w-full px-5 pt-5 pb-10"
              style={{ minHeight: '75dvh' }}
              variants={sheetSlide}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div style={{ width: 40, height: 5, borderRadius: 3, background: darkMode ? '#333' : '#e5e7eb', margin: '0 auto 16px' }} />
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
                    className="w-full bg-white dark:bg-[#222] text-gray-500 font-semibold text-[15px] py-[15px] rounded-2xl border border-gray-100 dark:border-[#2a2a2a]"
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

      {/* ── Rest timer popup ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRestTimer && restTimerContext && (
          <RestTimerPopup
            key="rest-timer"
            exerciseName={restTimerContext.exerciseName}
            setNumber={restTimerContext.setNumber}
            nextSetNumber={restTimerContext.nextSetNumber}
            defaultSeconds={restTimerSecs}
            onClose={() => setShowRestTimer(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Add exercise sheet ────────────────────────────────────────────────── */}
      {addExSheet}

    </motion.div>
  );
}
