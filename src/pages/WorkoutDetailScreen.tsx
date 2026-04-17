import { useState } from 'react';
import {
  ChevronLeft, Share2, Clock, Dumbbell, CheckSquare, FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WorkoutShareCard from '@/components/general/WorkoutShareCard';
import {
  slideRight, staggerContainer, staggerChild,
  prBurst, setRowStagger, setRowChild, press,
} from '@/animations/fitnex.variants';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DetailSet = {
  set_number: number;
  weight_kg: number;
  reps: number;
  is_completed: boolean;
  is_pr: boolean;
};

export type DetailExercise = {
  id: string;
  name: string;
  emoji: string;
  total_volume: number;
  sets: DetailSet[];
};

export type WorkoutDetail = {
  id: string;
  date: string;
  started_at: string;
  finished_at: string;
  duration_secs: number;
  total_volume_kg: number;
  total_sets: number;
  notes?: string;
  hasPR: boolean;
  prExercise?: string;
  prKg?: number;
  prReps?: number;
  days_ago_label: string;
  exercises: DetailExercise[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
};

// ─── Exercise card ────────────────────────────────────────────────────────────

function ExerciseCard({ exercise }: { exercise: DetailExercise }) {
  return (
    <motion.div
      variants={staggerChild}
      className="bg-white rounded-[14px] border border-[#f0f0f0] overflow-hidden"
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f8f9fa]">
        <div className="w-9 h-9 rounded-xl bg-tint-muted flex items-center justify-center text-base shrink-0">
          {exercise.emoji}
        </div>
        <p className="font-bold text-[15px] flex-1 leading-snug">{exercise.name}</p>
        <p className="text-tint font-bold text-[13px] tabular-nums shrink-0">
          {exercise.total_volume > 0 ? `${exercise.total_volume.toLocaleString()} kg` : '—'}
        </p>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-4 pt-2.5 pb-1">
        <span className="w-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide shrink-0">
          Set
        </span>
        <span className="flex-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide">
          Kg
        </span>
        <span className="flex-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide">
          Reps
        </span>
        <span className="w-10 shrink-0" />
      </div>

      {/* Set rows */}
      <motion.div
        className="pb-1"
        variants={setRowStagger}
        initial="initial"
        animate="animate"
      >
        {exercise.sets.map((set, i, arr) => (
          <motion.div
            key={set.set_number}
            variants={setRowChild}
            className="flex items-center px-4 py-2.5"
            style={{
              backgroundColor: set.is_pr
                ? '#fef3c7'
                : set.is_completed
                  ? '#f0fdf4'
                  : undefined,
              borderBottom: i < arr.length - 1 ? '1px solid #f8f9fa' : undefined,
            }}
          >
            {/* Set number */}
            <span className={`w-6 text-center text-[13px] font-bold shrink-0 ${
              set.is_pr ? 'text-amber-600' : set.is_completed ? 'text-tint' : 'text-gray-400'
            }`}>
              {set.set_number}
            </span>

            {/* Weight */}
            <span className="flex-1 text-center text-[14px] font-bold text-gray-800 tabular-nums">
              {set.weight_kg > 0 ? set.weight_kg : '—'}
            </span>

            {/* Reps */}
            <span className="flex-1 text-center text-[14px] font-bold text-gray-800 tabular-nums">
              {set.reps}
            </span>

            {/* PR badge or spacer */}
            <div className="w-10 flex justify-end shrink-0">
              {set.is_pr && (
                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  PR
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type Props = {
  workout: WorkoutDetail;
  onBack: () => void;
};

export default function WorkoutDetailScreen({ workout, onBack }: Props) {
  const [showShare, setShowShare] = useState(false);

  const durationMins = Math.round(workout.duration_secs / 60);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 overflow-y-auto"
        style={{ backgroundColor: '#f8f9fa' }}
        variants={slideRight}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="max-w-[390px] mx-auto pb-10">

          {/* ── 1. Header ──────────────────────────────────────────────────── */}
          <header className="bg-white px-4 pt-12 pb-4 flex items-center justify-between sticky top-0 z-10">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"
              whileTap={press.whileTap}
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </motion.button>

            <p className="font-bold text-[16px] absolute left-1/2 -translate-x-1/2">
              {workout.date}
            </p>

            <motion.button
              onClick={() => setShowShare(true)}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"
              whileTap={press.whileTap}
            >
              <Share2 size={17} className="text-gray-600" />
            </motion.button>
          </header>

          <div className="px-4 pt-4 flex flex-col gap-4">

            {/* ── 2. Stats row ───────────────────────────────────────────────── */}
            <motion.div
              className="grid grid-cols-3 gap-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {/* Duration */}
              <motion.div
                variants={staggerChild}
                className="bg-white rounded-[14px] border border-[#f0f0f0] p-3 flex flex-col items-center gap-1.5"
              >
                <div className="w-8 h-8 rounded-xl bg-tint-muted flex items-center justify-center">
                  <Clock size={15} className="text-tint" />
                </div>
                <p className="text-[15px] font-black tabular-nums leading-tight text-center">
                  {fmtDuration(workout.duration_secs)}
                </p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                  Duration
                </p>
              </motion.div>

              {/* Volume */}
              <motion.div
                variants={staggerChild}
                className="bg-white rounded-[14px] border border-[#f0f0f0] p-3 flex flex-col items-center gap-1.5"
              >
                <div className="w-8 h-8 rounded-xl bg-tint-muted flex items-center justify-center">
                  <Dumbbell size={15} className="text-tint" />
                </div>
                <p className="text-[15px] font-black tabular-nums leading-tight text-center">
                  {workout.total_volume_kg.toLocaleString()}
                  <span className="text-[11px] font-semibold text-gray-400 ml-0.5">kg</span>
                </p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                  Volume
                </p>
              </motion.div>

              {/* Sets */}
              <motion.div
                variants={staggerChild}
                className="bg-white rounded-[14px] border border-[#f0f0f0] p-3 flex flex-col items-center gap-1.5"
              >
                <div className="w-8 h-8 rounded-xl bg-tint-muted flex items-center justify-center">
                  <CheckSquare size={15} className="text-tint" />
                </div>
                <p className="text-[15px] font-black tabular-nums leading-tight text-center">
                  {workout.total_sets}
                </p>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                  Sets
                </p>
              </motion.div>
            </motion.div>

            {/* ── 3. PR Banner ───────────────────────────────────────────────── */}
            {workout.hasPR && workout.prExercise && (
              <motion.div
                variants={prBurst}
                initial="initial"
                animate="animate"
                className="rounded-[14px] border border-amber-200 px-4 py-3.5 flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}
              >
                <span className="text-2xl shrink-0">🏆</span>
                <div className="min-w-0">
                  <p className="font-black text-amber-800 text-[14px] leading-snug">
                    Personal Record
                  </p>
                  <p className="text-amber-700/80 text-[12px] mt-0.5 font-medium truncate">
                    {workout.prExercise} · {workout.prKg} kg × {workout.prReps} reps
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── 4. Exercise breakdown ──────────────────────────────────────── */}
            <motion.div
              className="flex flex-col gap-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {workout.exercises.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} />
              ))}
            </motion.div>

            {/* ── 5. Session notes ───────────────────────────────────────────── */}
            {workout.notes && (
              <motion.div
                variants={staggerChild}
                initial="initial"
                animate="animate"
                className="bg-white rounded-[14px] border border-[#f0f0f0] px-4 py-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={15} className="text-gray-400 shrink-0" />
                  <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wide">
                    Session notes
                  </p>
                </div>
                <p className="text-[14px] text-gray-500 leading-relaxed">{workout.notes}</p>
              </motion.div>
            )}

            {/* ── 6. Metadata footer ─────────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-1 py-2">
              <p className="text-[12px] text-gray-400 font-medium text-center">
                Started at {workout.started_at} · Finished at {workout.finished_at}
              </p>
              <p className="text-[11px] text-gray-300 font-medium">
                Logged {workout.days_ago_label}
              </p>
            </div>

            {/* ── 7. Share button ────────────────────────────────────────────── */}
            <motion.button
              onClick={() => setShowShare(true)}
              className="w-full bg-tint rounded-2xl py-[17px] flex items-center justify-center gap-2 font-black text-white text-[16px] shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
              whileTap={press.whileTap}
            >
              <Share2 size={18} />
              Share this workout
            </motion.button>

          </div>
        </div>
      </motion.div>

      {/* ── Share overlay ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showShare && (
          <WorkoutShareCard
            name="Tife"
            handle="@whoistife_x"
            date={workout.date}
            durationMinutes={durationMins}
            totalVolume={workout.total_volume_kg}
            totalSets={workout.total_sets}
            streak={12}
            hasPR={workout.hasPR}
            prExercise={workout.prExercise ?? ''}
            prKg={workout.prKg ?? 0}
            prReps={workout.prReps ?? 0}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
