import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useStore from '@/store';
import { getWorkoutById, type WorkoutWithExercisesAndSets } from '@/lib/supabase';
import { type WorkoutWithExercises } from '@/types/models';
import WorkoutDetailScreen, {
  type WorkoutDetail,
  type DetailExercise,
  type DetailSet,
} from './WorkoutDetailScreen';

// ─── Emoji helper ─────────────────────────────────────────────────────────────

const getEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('bench') || n.includes('chest') || n.includes('fly'))          return '🏋️';
  if (n.includes('squat') || n.includes('leg')   || n.includes('lunge'))         return '🦵';
  if (n.includes('dead')  || n.includes('row')   || n.includes('pull'))          return '💪';
  if (n.includes('shoulder') || n.includes('lateral') || n.includes('overhead')) return '🔥';
  if (n.includes('curl') || n.includes('tricep') || n.includes('bicep'))         return '💪';
  return '🏋️';
};

// ─── Adapter: Supabase workout → WorkoutDetail ────────────────────────────────

function dbWorkoutToDetail(w: WorkoutWithExercisesAndSets): WorkoutDetail {
  const started = dayjs(w.started_at);
  const finished = w.finished_at
    ? dayjs(w.finished_at)
    : started.add(w.duration_secs ?? 0, 'second');

  const diffDays = dayjs().diff(started, 'day');
  const daysAgoLabel =
    diffDays === 0 ? 'today' : diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;

  const exercises: DetailExercise[] = w.exercises.map((ex) => {
    const sets: DetailSet[] = ex.sets.map((s) => ({
      set_number:   s.set_number,
      weight_kg:    Number(s.weight_kg) || 0,
      reps:         Number(s.reps) || 0,
      is_completed: s.is_completed,
      is_pr:        false, // PR context requires full history — not available for single-fetch
    }));
    const total_volume = sets
      .filter((s) => s.is_completed)
      .reduce((a, s) => a + s.weight_kg * s.reps, 0);
    return { id: ex.id, name: ex.name, emoji: ex.emoji || getEmoji(ex.name), total_volume, sets };
  });

  return {
    id:              w.id,
    date:            started.format('ddd, D MMM'),
    started_at:      started.format('h:mm A'),
    finished_at:     finished.format('h:mm A'),
    duration_secs:   w.duration_secs ?? 0,
    total_volume_kg: Number(w.total_volume_kg) || 0,
    total_sets:      Number(w.total_sets) || 0,
    hasPR:           false,
    days_ago_label:  daysAgoLabel,
    exercises,
  };
}

// ─── Adapter: store workout → WorkoutDetail ───────────────────────────────────

function storeWorkoutToDetail(
  workout: WorkoutWithExercises,
  allWorkouts: WorkoutWithExercises[],
): WorkoutDetail {
  const createdAt  = dayjs(workout.createdAt);
  const finishedAt = workout.finishedAt ? dayjs(workout.finishedAt) : null;

  const olderWorkouts = allWorkouts.filter(
    (w) => dayjs(w.createdAt).isBefore(createdAt),
  );

  const histMax: Record<string, number> = {};
  for (const old of olderWorkouts) {
    for (const ex of old.exercises) {
      const max = Math.max(0, ...ex.sets.map((s) => s.weight ?? 0));
      histMax[ex.name] = Math.max(histMax[ex.name] ?? 0, max);
    }
  }

  let prExercise: string | undefined;
  let prKg:       number | undefined;
  let prReps:     number | undefined;

  const exercises: DetailExercise[] = workout.exercises.map((ex, exIdx) => {
    const prevMax = histMax[ex.name] ?? 0;
    const sets: DetailSet[] = ex.sets.map((s, i) => {
      const weight_kg = s.weight ?? 0;
      const reps      = s.reps   ?? 0;
      const isPR      = weight_kg > 0 && weight_kg > prevMax;
      if (isPR && prExercise === undefined) {
        prExercise = ex.name;
        prKg       = weight_kg;
        prReps     = reps;
      }
      return { set_number: i + 1, weight_kg, reps, is_completed: true, is_pr: isPR };
    });
    const total_volume = sets.reduce((a, s) => a + s.weight_kg * s.reps, 0);
    return { id: `${workout.id}-${exIdx}`, name: ex.name, emoji: getEmoji(ex.name), total_volume, sets };
  });

  const durationSecs = finishedAt ? finishedAt.diff(createdAt, 'second') : 0;
  const totalVolume  = exercises.reduce((a, ex) => a + ex.total_volume, 0);
  const totalSets    = exercises.reduce((a, ex) => a + ex.sets.length,  0);

  const diffDays = dayjs().diff(createdAt, 'day');
  const daysAgoLabel =
    diffDays === 0 ? 'today' : diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;

  return {
    id:              workout.id,
    date:            createdAt.format('ddd, D MMM'),
    started_at:      createdAt.format('h:mm A'),
    finished_at:     finishedAt ? finishedAt.format('h:mm A') : '—',
    duration_secs:   durationSecs,
    total_volume_kg: totalVolume,
    total_sets:      totalSets,
    hasPR:           !!prExercise,
    prExercise,
    prKg,
    prReps,
    days_ago_label:  daysAgoLabel,
    exercises,
  };
}

// ─── Route component ──────────────────────────────────────────────────────────

export default function WorkoutDetail() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const storeWorkout   = useStore((s) => s.workouts.find((w) => w.id === id));
  const allWorkouts    = useStore((s) => s.workouts);

  const [detail,  setDetail]  = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!id) { setError(true); setLoading(false); return; }

    // Guest / local workout — already in store
    if (storeWorkout) {
      setDetail(storeWorkoutToDetail(storeWorkout, allWorkouts));
      setLoading(false);
      return;
    }

    // Authenticated workout — fetch from Supabase
    getWorkoutById(id).then((data) => {
      if (data) setDetail(dbWorkoutToDetail(data));
      else setError(true);
    }).catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">Loading workout…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-gray-400 text-sm">Workout not found</p>
        <button
          onClick={() => navigate(-1)}
          className="text-tint text-sm font-semibold"
        >
          Go back
        </button>
      </div>
    );
  }

  return <WorkoutDetailScreen workout={detail} onBack={() => navigate(-1)} />;
}
