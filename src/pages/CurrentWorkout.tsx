import { useState, useEffect, useRef, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
  const inputDone = 'bg-[#f0fdf4] border-tint/30 text-tint';
  const inputIdle = 'bg-white border-gray-200 text-gray-800';

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
        completed ? 'text-tint' : 'text-gray-400'
      }`}>
        {index + 1}
      </span>

      {/* Previous */}
      <div className="w-[80px] shrink-0 px-2 py-2 bg-white border border-gray-200 rounded-xl text-center text-[13px] font-semibold text-gray-500 truncate">
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
            ? 'border-tint shadow-[0_2px_8px_rgba(16,185,129,0.35)]'
            : 'border-gray-200'
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
    <div className="bg-white rounded-2xl border border-[#f0f0f0]">

      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
        <div className="w-10 h-10 rounded-xl bg-tint-muted flex items-center justify-center text-lg shrink-0">
          {getEmoji(exercise.name)}
        </div>
        <p className="font-bold flex-1 text-[16px] leading-snug">{exercise.name}</p>

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
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 relative z-[10] active:bg-gray-50"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-100 shadow-lg z-[10] w-44 overflow-hidden">
              <button
                onClick={() => { onRemove(); setMenuOpen(false); }}
                className="w-full px-4 py-3 text-left text-sm text-red-500 font-semibold active:bg-red-50"
              >
                Remove exercise
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <span className="w-7 text-center text-[11px] font-bold text-gray-400 tracking-wide shrink-0 uppercase">Set</span>
        <span className="w-[80px] text-center text-[11px] font-bold text-gray-400 tracking-wide shrink-0 uppercase">Previous</span>
        <span className="flex-1 text-center text-[11px] font-bold text-gray-400 tracking-wide uppercase">KG</span>
        <span className="flex-1 text-center text-[11px] font-bold text-gray-400 tracking-wide uppercase">Reps</span>
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
        className="w-full py-3 border-t border-dashed border-gray-200 text-sm font-semibold text-gray-400 flex items-center justify-center gap-1.5 active:bg-gray-50 rounded-b-2xl"
      >
        <Plus size={14} />
        Add set
      </button>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function CurrentWorkout() {
  const navigate       = useNavigate();
  const currentWorkout = useStore((s) => s.currentWorkout);
  const workouts       = useStore((s) => s.workouts);
  const endWorkout     = useStore((s) => s.endWorkout);
  const addExercise    = useStore((s) => s.addExercise);
  const removeExercise = useStore((s) => s.removeExercise);

  const [elapsed,    setElapsed]    = useState(0);
  const [isRunning,  setIsRunning]  = useState(true);
  const [completedSetIds, setCompleted] = useState<Set<string>>(new Set());
  const [restSeconds,  setRestSeconds]  = useState(0);
  const [showRest,     setShowRest]     = useState(false);
  const [addExOpen,    setAddExOpen]    = useState(false);
  const [search,       setSearch]       = useState('');

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

  // Previous values — look up from history once per render
  const previousMap = useMemo(() => {
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

  if (!currentWorkout) return <Navigate to="/" replace />;

  const handleToggleSet = (setId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(setId)) {
        next.delete(setId);
      } else {
        next.add(setId);
        setRestSeconds(90);
        setShowRest(true);
      }
      return next;
    });
  };

  const handleFinishAndSummary = () => {
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

    endWorkout();
    navigate('/workout/summary', {
      state: {
        date: dayjs(currentWorkout.createdAt).format('ddd, D MMM'),
        startTime: dayjs(currentWorkout.createdAt).format('h:mm A'),
        durationSeconds: elapsed,
        exercises: summaryExercises,
      },
    });
  };

  const filtered = exerciseList.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-[#f8f9fa]"
      variants={screenEnter}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 px-4 pt-10 pb-4 sticky top-0 z-20">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[18px] font-black leading-snug">New Workout</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {dayjs().format('ddd, D MMM')}
              {' · '}
              {currentWorkout.exercises.length} exercise{currentWorkout.exercises.length !== 1 ? 's' : ''}
            </p>
          </div>
          <motion.button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mt-1 active:bg-gray-200"
            whileTap={press.whileTap}
          >
            <X size={18} className="text-gray-500" />
          </motion.button>
        </div>
      </header>

      {/* ── Scrollable content ──────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-4 pb-[120px] flex flex-col gap-4">

        {/* ── Duration card ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#f0f0f0] px-4 py-4 flex items-center">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-tint-muted flex items-center justify-center shrink-0">
              <Clock size={18} className="text-tint" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Duration</p>
              <p className="text-3xl font-black tabular-nums leading-tight">{fmtTime(elapsed)}</p>
            </div>
          </div>

          {isRunning ? (
            <motion.button
              onClick={() => setIsRunning(false)}
              className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center"
              whileTap={press.whileTap}
            >
              <Pause size={18} className="text-gray-500" />
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
            <p className="font-bold text-[15px]">Exercises</p>
            <motion.button
              onClick={() => setAddExOpen(true)}
              className="flex items-center gap-1.5 border border-gray-200 bg-white text-tint text-sm font-bold px-4 py-2 rounded-xl"
              whileTap={press.whileTap}
            >
              <Plus size={14} strokeWidth={2.5} />
              Add exercise
            </motion.button>
          </div>

          {currentWorkout.exercises.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#f0f0f0] py-14 flex flex-col items-center gap-2">
              <p className="text-3xl">🏋️</p>
              <p className="font-semibold text-gray-500 text-sm mt-1">No exercises yet</p>
              <p className="text-xs text-gray-400">Tap "Add exercise" to get started</p>
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
          onClick={handleFinishAndSummary}
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
              className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:w-11/12 sm:max-w-md flex flex-col"
              style={{ maxHeight: '88vh' }}
              variants={sheetSlide}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {/* drag handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              <div className="flex items-center justify-between px-5 py-4">
                <p className="text-lg font-bold">Add exercise</p>
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
                  className="w-full py-3 px-4 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-tint placeholder:text-gray-400"
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
                    className="w-full text-left flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 rounded-lg"
                    whileTap={press.whileTap}
                  >
                    <span className="w-9 h-9 rounded-xl bg-tint-muted flex items-center justify-center text-base shrink-0">
                      {getEmoji(ex.name)}
                    </span>
                    <div>
                      <p className="font-semibold text-sm">{ex.name}</p>
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
