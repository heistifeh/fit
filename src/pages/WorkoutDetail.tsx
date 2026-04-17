import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import useStore from '@/store';
import { WorkoutWithExercises } from '@/types/models';
import WorkoutDetailScreen, {
  type WorkoutDetail,
  type DetailExercise,
  type DetailSet,
} from './WorkoutDetailScreen';

// ─── Emoji helper (mirrors CurrentWorkout) ────────────────────────────────────

const getEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('bench') || n.includes('chest') || n.includes('fly'))          return '🏋️';
  if (n.includes('squat') || n.includes('leg')   || n.includes('lunge'))         return '🦵';
  if (n.includes('dead')  || n.includes('row')   || n.includes('pull'))          return '💪';
  if (n.includes('shoulder') || n.includes('lateral') || n.includes('overhead')) return '🔥';
  if (n.includes('curl') || n.includes('tricep') || n.includes('bicep'))         return '💪';
  return '🏋️';
};

// ─── Adapter: store workout → WorkoutDetail ───────────────────────────────────

function toWorkoutDetail(
  workout: WorkoutWithExercises,
  allWorkouts: WorkoutWithExercises[],
): WorkoutDetail {
  const createdAt  = dayjs(workout.createdAt);
  const finishedAt = workout.finishedAt ? dayjs(workout.finishedAt) : null;

  // Workouts created strictly before this one are "older" — used for PR detection
  const olderWorkouts = allWorkouts.filter(
    (w) => dayjs(w.createdAt).isBefore(createdAt),
  );

  // Max weight per exercise name across older workouts
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

      return {
        set_number:   i + 1,
        weight_kg,
        reps,
        is_completed: true,
        is_pr:        isPR,
      };
    });

    const total_volume = sets.reduce((a, s) => a + s.weight_kg * s.reps, 0);

    return {
      id:    `${workout.id}-${exIdx}`,
      name:  ex.name,
      emoji: getEmoji(ex.name),
      total_volume,
      sets,
    };
  });

  const durationSecs = finishedAt
    ? finishedAt.diff(createdAt, 'second')
    : 0;

  const totalVolume = exercises.reduce((a, ex) => a + ex.total_volume, 0);
  const totalSets   = exercises.reduce((a, ex) => a + ex.sets.length,  0);

  const diffDays = dayjs().diff(createdAt, 'day');
  const daysAgoLabel =
    diffDays === 0 ? 'today' :
    diffDays === 1 ? 'yesterday' :
    `${diffDays} days ago`;

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
  const { id }        = useParams<{ id: string }>();
  const navigate      = useNavigate();
  const workout       = useStore((s) => s.workouts.find((w) => w.id === id));
  const allWorkouts   = useStore((s) => s.workouts);

  if (!workout) {
    return (
      <p className="text-center mt-20 text-gray-400 text-sm">
        Workout not found
      </p>
    );
  }

  return (
    <WorkoutDetailScreen
      workout={toWorkoutDetail(workout, allWorkouts)}
      onBack={() => navigate(-1)}
    />
  );
}
