import { createClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

// ─── Client ───────────────────────────────────────────────────────────────────

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnon);

// ─── Database types (manually typed from 001_fitnex_schema.sql) ───────────────

export type Profile = {
  id:               string;
  name:             string;
  handle:           string | null;
  avatar_url:       string | null;
  weight_unit:      'kg' | 'lbs';
  rest_timer_secs:  number;
  dark_mode:        boolean;
  reminders:        boolean;
  created_at:       string;
  updated_at:       string;
};

export type Exercise = {
  id:           string;
  name:         string;
  muscle_group: string;
  equipment:    string;
  emoji:        string;
  image_url:    string | null;
  image_path:   string | null;
  created_at:   string;
};

export type Workout = {
  id:              string;
  user_id:         string;
  started_at:      string;
  finished_at:     string | null;
  duration_secs:   number | null;
  total_volume_kg: number | null;
  total_sets:      number | null;
  notes:           string | null;
  created_at:      string;
};

export type WorkoutExercise = {
  id:          string;
  workout_id:  string;
  exercise_id: string | null;
  name:        string;
  emoji:       string;
  order_index: number;
  created_at:  string;
};

export type WorkoutSet = {
  id:                   string;
  workout_exercise_id:  string;
  set_number:           number;
  weight_kg:            number | null;
  reps:                 number | null;
  one_rm:               number | null;
  is_completed:         boolean;
  created_at:           string;
};

export type PersonalRecord = {
  id:            string;
  user_id:       string;
  exercise_name: string;
  exercise_id:   string | null;
  weight_kg:     number;
  reps:          number;
  one_rm:        number | null;
  achieved_at:   string;
  workout_id:    string | null;
  created_at:    string;
};

// ─── Nested / composed types ──────────────────────────────────────────────────

export type WorkoutSetRow = Omit<WorkoutSet, 'workout_exercise_id'>;

export type WorkoutExerciseWithSets = WorkoutExercise & {
  sets: WorkoutSetRow[];
};

export type WorkoutWithExercisesAndSets = Workout & {
  exercises: WorkoutExerciseWithSets[];
};

// ─── Payload types (for saveWorkout) ─────────────────────────────────────────

type SaveSetPayload = {
  set_number:   number;
  weight_kg:    number | null;
  reps:         number | null;
  one_rm:       number | null;
  is_completed: boolean;
};

type SaveExercisePayload = {
  exercise_id:  string | null;
  name:         string;
  emoji:        string;
  order_index:  number;
  sets:         SaveSetPayload[];
};

type SaveWorkoutPayload = {
  user_id:         string;
  started_at:      string;
  finished_at:     string | null;
  duration_secs:   number;
  total_volume_kg: number;
  total_sets:      number;
  notes:           string | null;
  exercises:       SaveExercisePayload[];
};

// ─── RPC return types ─────────────────────────────────────────────────────────

type PercentileRankRow = {
  user_id:        string;
  weekly_volume:  number;
  percentile_rank: number;
};

// ─── 1. getWorkouts ───────────────────────────────────────────────────────────
// Fetch all workouts for a user, newest first, with nested exercises and sets.

export async function getWorkouts(
  userId: string,
): Promise<WorkoutWithExercisesAndSets[]> {
  const { data: workouts, error: workoutsErr } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (workoutsErr) throw workoutsErr;
  if (!workouts || workouts.length === 0) return [];

  const workoutIds = workouts.map((w: Workout) => w.id);

  const { data: exercises, error: exErr } = await supabase
    .from('workout_exercises')
    .select('*')
    .in('workout_id', workoutIds)
    .order('order_index', { ascending: true });

  if (exErr) throw exErr;

  const exerciseIds = (exercises ?? []).map((e: WorkoutExercise) => e.id);

  const { data: sets, error: setsErr } =
    exerciseIds.length > 0
      ? await supabase
          .from('workout_sets')
          .select('*')
          .in('workout_exercise_id', exerciseIds)
          .order('set_number', { ascending: true })
      : { data: [] as WorkoutSet[], error: null };

  if (setsErr) throw setsErr;

  // Group sets by workout_exercise_id
  const setsByExercise = new Map<string, WorkoutSetRow[]>();
  for (const s of (sets ?? []) as WorkoutSet[]) {
    const key = s.workout_exercise_id;
    if (!setsByExercise.has(key)) setsByExercise.set(key, []);
    setsByExercise.get(key)!.push({
      id:           s.id,
      set_number:   s.set_number,
      weight_kg:    s.weight_kg,
      reps:         s.reps,
      one_rm:       s.one_rm,
      is_completed: s.is_completed,
      created_at:   s.created_at,
    });
  }

  // Group exercises by workout_id
  const exercisesByWorkout = new Map<string, WorkoutExerciseWithSets[]>();
  for (const ex of (exercises ?? []) as WorkoutExercise[]) {
    if (!exercisesByWorkout.has(ex.workout_id)) {
      exercisesByWorkout.set(ex.workout_id, []);
    }
    exercisesByWorkout.get(ex.workout_id)!.push({
      ...ex,
      sets: setsByExercise.get(ex.id) ?? [],
    });
  }

  return workouts.map((w: Workout) => ({
    ...w,
    exercises: exercisesByWorkout.get(w.id) ?? [],
  }));
}

// ─── 2. saveWorkout ───────────────────────────────────────────────────────────
// Insert a complete workout (exercises + sets) atomically via the save_workout RPC.
// Returns the new workout id on success.

export async function saveWorkout(
  payload: SaveWorkoutPayload,
): Promise<string> {
  const { data, error } = await supabase.rpc('save_workout', {
    p_workout: payload,
  });

  if (error) throw error;
  return data as string;
}

// ─── 3. getPersonalRecords ────────────────────────────────────────────────────
// Fetch all PR rows for a user, ordered by achieved_at descending.

export async function getPersonalRecords(
  userId: string,
): Promise<PersonalRecord[]> {
  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', userId)
    .order('achieved_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as PersonalRecord[];
}

// ─── 4. getWeeklyVolume ───────────────────────────────────────────────────────
// Sum total_volume_kg for the current calendar week (Mon 00:00 → Sun 23:59 UTC).
// Returns 0 if no workouts this week.

export async function getWeeklyVolume(userId: string): Promise<number> {
  const weekStart = dayjs().startOf('week').toISOString();
  const weekEnd   = dayjs().endOf('week').toISOString();

  const { data, error } = await supabase
    .from('workouts')
    .select('total_volume_kg')
    .eq('user_id', userId)
    .gte('started_at', weekStart)
    .lte('started_at', weekEnd);

  if (error) throw error;

  return (data ?? []).reduce(
    (sum: number, row: { total_volume_kg: number | null }) =>
      sum + (Number(row.total_volume_kg) || 0),
    0,
  );
}

// ─── 5. getPercentileRank ─────────────────────────────────────────────────────
// Returns the user's weekly-volume percentile rank vs. all users this week.
// 99 means top 1%; 1 means bottom 1%.
// Calls the get_percentile_rank() SQL RPC (SECURITY DEFINER, window function).
// Returns null if the user has no volume this week (not enough data).

export async function getPercentileRank(
  userId: string,
): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_percentile_rank');

  if (error) throw error;

  const rows = (data ?? []) as PercentileRankRow[];
  const userRow = rows.find((r) => r.user_id === userId);
  return userRow?.percentile_rank ?? null;
}

// ─── 6. updatePersonalRecords ─────────────────────────────────────────────────
// For each exercise, checks if the best set in this workout beats the stored PR.
// Upserts personal_records on conflict (user_id, exercise_name).

type PRExerciseInput = {
  name: string;
  exercise_id?: string | null;
  sets: { kg: number; reps: number; completed: boolean }[];
};

export async function updatePersonalRecords(
  userId: string,
  exercises: PRExerciseInput[],
): Promise<void> {
  for (const exercise of exercises) {
    const completedSets = exercise.sets.filter(
      (s) => s.completed && s.kg > 0 && s.reps > 0,
    );
    if (!completedSets.length) continue;

    const bestSet = completedSets.reduce((best, s) =>
      s.kg * s.reps > best.kg * best.reps ? s : best,
    );

    const { data: currentPR } = await supabase
      .from('personal_records')
      .select('weight_kg, reps')
      .eq('user_id', userId)
      .eq('exercise_name', exercise.name)
      .maybeSingle();

    const isNewPR =
      !currentPR ||
      bestSet.kg * bestSet.reps > Number(currentPR.weight_kg) * (currentPR.reps as number);

    if (isNewPR) {
      const oneRM =
        bestSet.reps < 37
          ? Math.round(bestSet.kg * (36 / (37 - bestSet.reps)) * 10) / 10
          : bestSet.kg;
      await supabase.from('personal_records').upsert(
        {
          user_id:       userId,
          exercise_name: exercise.name,
          exercise_id:   exercise.exercise_id ?? null,
          weight_kg:     bestSet.kg,
          reps:          bestSet.reps,
          one_rm:        oneRM,
          achieved_at:   new Date().toISOString(),
        },
        { onConflict: 'user_id,exercise_name' },
      );
    }
  }
}

// ─── 7. uploadAvatar ──────────────────────────────────────────────────────────
// Upload an image to the avatars bucket, save the public URL to profiles,
// and return the public URL.

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() ?? 'jpg';
  const filePath = `${userId}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Cache-bust so the browser picks up the new image immediately
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

  await supabase
    .from('profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', userId);

  return publicUrl;
}
