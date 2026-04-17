import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Clock, Dumbbell, CheckSquare, Share2, Check, Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WorkoutShareCard from '@/components/general/WorkoutShareCard';
import {
  screenEnter, staggerContainer, staggerChild, prBurst, countUp, press,
} from '@/animations/fitnex.variants';

// ─── Types ───────────────────────────────────────────────────────────────────

type SummarySet = {
  kg: number;
  reps: number;
  completed: boolean;
  isPR: boolean;
};

type SummaryExercise = {
  id: number | string;
  name: string;
  emoji: string;
  sets: SummarySet[];
};

export type WorkoutSummaryProps = {
  date: string;
  startTime: string;
  durationSeconds: number;
  exercises: SummaryExercise[];
  onSave?: () => void;
  onDiscard?: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkoutSummary() {
  const location = useLocation();
  const navigate = useNavigate();

  const props = (location.state ?? {}) as WorkoutSummaryProps;
  const {
    date = 'Today',
    startTime = '',
    durationSeconds = 0,
    exercises = [],
    onSave,
    onDiscard,
  } = props;

  // ── Derived values ──────────────────────────────────────────────────────────
  const completedSets = exercises.flatMap((e) => e.sets.filter((s) => s.completed));

  const totalVolume = completedSets.reduce((acc, s) => acc + s.kg * s.reps, 0);
  const totalSets   = completedSets.length;
  const durationLabel = fmtDuration(durationSeconds);

  const firstPRSet  = exercises
    .flatMap((e) => e.sets.map((s) => ({ ...s, exerciseName: e.name })))
    .find((s) => s.isPR && s.completed);
  const hasPR   = !!firstPRSet;
  const prLabel = firstPRSet
    ? `${firstPRSet.exerciseName} · ${firstPRSet.kg} kg × ${firstPRSet.reps} reps`
    : '';

  const volumePerExercise = (ex: SummaryExercise) =>
    ex.sets
      .filter((s) => s.completed)
      .reduce((acc, s) => acc + s.kg * s.reps, 0);

  const [showShare, setShowShare] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (onSave) { onSave(); } else { navigate('/'); }
  };
  const handleDiscard = () => {
    if (onDiscard) { onDiscard(); } else { navigate('/'); }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="min-h-screen bg-[#f8f9fa] overflow-y-auto pb-10"
      variants={screenEnter}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      <div className="mx-auto max-w-[390px]">

        {/* ── 1. Hero Banner ────────────────────────────────────────────────── */}
        <div className="relative bg-[#10B981] px-5 pt-14 pb-8 overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-white/10 pointer-events-none" />

          {/* Top row */}
          <div className="relative flex items-center justify-between mb-5">
            <span className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <Check size={12} strokeWidth={3} />
              Workout complete
            </span>
            <motion.button
              onClick={() => setShowShare(true)}
              className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"
              whileTap={press.whileTap}
            >
              <Share2 size={16} className="text-white" />
            </motion.button>
          </div>

          {/* Heading */}
          <h1 className="relative text-[26px] font-black text-white leading-tight mb-1">
            Great session, Tife! 💪
          </h1>

          {/* Subtext */}
          <p className="relative text-white/70 text-sm font-medium">
            {date}
            {startTime ? ` · Started at ${startTime}` : ''}
          </p>
        </div>

        {/* ── 2. Stats Row ──────────────────────────────────────────────────── */}
        <div className="px-4 -mt-4 relative z-10">
          <motion.div
            className="grid grid-cols-3 gap-3"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Duration */}
            <motion.div
              variants={staggerChild}
              className="bg-white rounded-2xl border border-[#f0f0f0] p-3 flex flex-col items-center gap-1.5"
            >
              <div className="w-8 h-8 rounded-xl bg-tint-muted flex items-center justify-center">
                <Clock size={15} className="text-tint" />
              </div>
              <p className="text-[15px] font-black tabular-nums leading-tight text-center">
                {durationLabel}
              </p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                Duration
              </p>
            </motion.div>

            {/* Volume */}
            <motion.div
              variants={staggerChild}
              className="bg-white rounded-2xl border border-[#f0f0f0] p-3 flex flex-col items-center gap-1.5"
            >
              <div className="w-8 h-8 rounded-xl bg-tint-muted flex items-center justify-center">
                <Dumbbell size={15} className="text-tint" />
              </div>
              <motion.p
                variants={countUp}
                className="text-[15px] font-black tabular-nums leading-tight text-center"
              >
                {totalVolume.toLocaleString()}
                <span className="text-[11px] font-semibold text-gray-400 ml-0.5">kg</span>
              </motion.p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                Volume
              </p>
            </motion.div>

            {/* Sets */}
            <motion.div
              variants={staggerChild}
              className="bg-white rounded-2xl border border-[#f0f0f0] p-3 flex flex-col items-center gap-1.5"
            >
              <div className="w-8 h-8 rounded-xl bg-tint-muted flex items-center justify-center">
                <CheckSquare size={15} className="text-tint" />
              </div>
              <p className="text-[15px] font-black tabular-nums leading-tight text-center">
                {totalSets}
              </p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                Sets
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* ── 3. PR Banner (conditional) ────────────────────────────────────── */}
        {hasPR && (
          <div className="px-4 mt-4">
            <motion.div
              variants={prBurst}
              initial="initial"
              animate="animate"
              className="rounded-2xl border border-amber-200 px-4 py-3.5 flex items-center gap-3"
              style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}
            >
              <span className="text-2xl shrink-0">🏆</span>
              <div className="min-w-0">
                <p className="font-black text-amber-800 text-[15px] leading-snug">
                  New Personal Record!
                </p>
                <p className="text-amber-700/80 text-xs mt-0.5 font-medium truncate">
                  {prLabel}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── 4. Exercise Summary ───────────────────────────────────────────── */}
        <div className="px-4 mt-6">
          <p className="font-black text-[16px] mb-3">Exercise Summary</p>

          <motion.div
            className="flex flex-col gap-3"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {exercises.map((exercise) => (
              <motion.div
                key={exercise.id}
                variants={staggerChild}
                className="bg-white rounded-2xl border border-[#f0f0f0] overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f8f9fa]">
                  <div className="w-9 h-9 rounded-xl bg-tint-muted flex items-center justify-center text-base shrink-0">
                    {exercise.emoji}
                  </div>
                  <p className="font-bold text-[15px] flex-1 leading-snug">{exercise.name}</p>
                  <p className="text-tint font-bold text-sm shrink-0">
                    {volumePerExercise(exercise).toLocaleString()} kg
                  </p>
                </div>

                {/* Sets table */}
                <div>
                  {exercise.sets.filter((s) => s.completed).map((set, i, arr) => (
                    <div
                      key={i}
                      className={`flex items-center px-4 py-2.5 ${
                        i < arr.length - 1 ? 'border-b border-[#f8f9fa]' : ''
                      }`}
                    >
                      <span className="w-6 text-[12px] text-gray-400 font-semibold shrink-0">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-[14px] font-bold text-gray-800">
                        {set.kg} kg
                      </span>
                      <div className="flex items-center justify-end gap-2">
                        {set.isPR ? (
                          <span className="bg-amber-100 text-amber-700 text-[11px] font-black px-2 py-0.5 rounded-full">
                            PR
                          </span>
                        ) : (
                          <span className="text-[14px] font-semibold text-gray-600">
                            {set.reps} reps
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            {exercises.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#f0f0f0] py-10 flex flex-col items-center gap-2">
                <p className="text-3xl">🏋️</p>
                <p className="text-sm text-gray-400 font-medium">No exercises recorded</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── 5. Bottom Actions ─────────────────────────────────────────────── */}
        <div className="px-4 mt-6 flex flex-col gap-3">
          <motion.button
            onClick={handleSave}
            className="w-full bg-[#10B981] text-white font-black text-[17px] py-[18px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
            whileTap={press.whileTap}
          >
            <Save size={19} />
            Save Workout
          </motion.button>
          <motion.button
            onClick={handleDiscard}
            className="w-full bg-white text-[#ef4444] font-semibold text-[15px] py-[16px] rounded-2xl border border-[#f0f0f0]"
            whileTap={press.whileTap}
          >
            Discard workout
          </motion.button>
        </div>

      </div>

      {/* ── Share card overlay ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showShare && (
          <WorkoutShareCard
            name="Tife"
            handle="@whoistife_x"
            date={date}
            durationMinutes={Math.round(durationSeconds / 60)}
            totalVolume={totalVolume}
            totalSets={totalSets}
            streak={12}
            hasPR={hasPR}
            prExercise={firstPRSet?.exerciseName ?? ''}
            prKg={firstPRSet?.kg ?? 0}
            prReps={firstPRSet?.reps ?? 0}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
