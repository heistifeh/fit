-- ============================================================
-- Fitnex — Supabase Migration
-- Paste this entire file into the Supabase SQL Editor and run once.
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- ─── 1. profiles ──────────────────────────────────────────────────────────────
-- Extends auth.users 1-to-1. Created automatically on signup via trigger.
-- Preferences live here — not a separate table.
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text        NOT NULL DEFAULT '',
  handle          text        UNIQUE,                         -- e.g. "@whoistife_x"
  -- Preferences (mirrors PreferencesContext localStorage keys)
  weight_unit     text        NOT NULL DEFAULT 'kg'
                              CHECK (weight_unit IN ('kg', 'lbs')),
  rest_timer_secs integer     NOT NULL DEFAULT 90
                              CHECK (rest_timer_secs BETWEEN 10 AND 600),
  dark_mode       boolean     NOT NULL DEFAULT false,
  reminders       boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. exercises (global library) ────────────────────────────────────────────
--
-- IMAGE MIGRATION PATH
-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 1 (now):    emoji column is used as the exercise icon.
--                   image_url and image_path are NULL.
--                   Frontend: renders exercise.emoji as the icon.
--
-- Phase 2 (later):  Upload real images to Supabase Storage bucket
--                   'exercise-images' (see bucket docs at bottom of file).
--                   Populate image_url (public CDN URL) and image_path
--                   (bucket-relative path for deletion/updates).
--                   Frontend: if (exercise.image_url) { <img src={image_url}> }
--                             else                    { <span>{emoji}</span>  }
--
-- Phase 3 (optional): Deprecate emoji column; keep as fallback only.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exercises (
  id           uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text  NOT NULL UNIQUE,
  muscle_group text  NOT NULL,
  equipment    text  NOT NULL DEFAULT 'barbell',
  emoji        text  NOT NULL DEFAULT '🏋️',
  -- Future image fields — nullable until images exist in Storage
  image_url    text,       -- Full public URL: https://<project>.supabase.co/storage/v1/object/public/exercise-images/<id>/thumbnail.webp
  image_path   text,       -- Bucket-relative path for updates/deletion: <exercise_id>/thumbnail.webp
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── 3. workouts ──────────────────────────────────────────────────────────────
-- Denormalized stats (duration_secs, total_volume_kg, total_sets) are computed
-- once on workout finish and stored here — never calculated live from sets.
CREATE TABLE IF NOT EXISTS public.workouts (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at       timestamptz   NOT NULL DEFAULT now(),
  finished_at      timestamptz,
  -- Denormalized — computed at finish, stored for fast reads
  duration_secs    integer,
  total_volume_kg  numeric(10,2),
  total_sets       integer,
  notes            text,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

-- ─── 4. workout_exercises ─────────────────────────────────────────────────────
-- Exercises logged within a specific workout session.
-- exercise_id is nullable to support custom exercise names not in the global library.
-- name is always stored here so the record survives even if the exercise row is deleted.
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id  uuid    NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id uuid    REFERENCES public.exercises(id) ON DELETE SET NULL,
  name        text    NOT NULL,             -- stored for display, survives exercise deletion
  emoji       text    NOT NULL DEFAULT '🏋️',
  order_index integer NOT NULL DEFAULT 0,   -- preserves log order within the workout
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 5. workout_sets ──────────────────────────────────────────────────────────
-- Individual sets logged under a workout_exercise.
-- one_rm uses Epley formula: weight_kg × (36 / (37 − reps)) — matches setService.ts
CREATE TABLE IF NOT EXISTS public.workout_sets (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id uuid        NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number          integer     NOT NULL CHECK (set_number > 0),
  weight_kg           numeric(8,2),
  reps                integer     CHECK (reps > 0),
  one_rm              numeric(8,2),   -- Epley: weight_kg × (36 / (37 − reps))
  is_completed        boolean     NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── 6. personal_records ──────────────────────────────────────────────────────
-- One row per (user, exercise_name). Upserted on every workout save.
-- Keyed by exercise_name (not exercise_id) so custom exercises are supported.
CREATE TABLE IF NOT EXISTS public.personal_records (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_name text          NOT NULL,
  exercise_id   uuid          REFERENCES public.exercises(id) ON DELETE SET NULL,
  weight_kg     numeric(8,2)  NOT NULL,
  reps          integer       NOT NULL,
  one_rm        numeric(8,2),
  achieved_at   timestamptz   NOT NULL DEFAULT now(),
  workout_id    uuid          REFERENCES public.workouts(id) ON DELETE SET NULL,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  -- One PR record per user per exercise — use ON CONFLICT DO UPDATE for upserts
  UNIQUE (user_id, exercise_name)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_workouts_user_id
  ON public.workouts(user_id);

CREATE INDEX IF NOT EXISTS idx_workouts_user_started
  ON public.workouts(user_id, started_at DESC);       -- history + home recent list

CREATE INDEX IF NOT EXISTS idx_workouts_started_at
  ON public.workouts(started_at DESC);                -- weekly volume aggregation

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout
  ON public.workout_exercises(workout_id);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise
  ON public.workout_exercises(exercise_id);

CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise
  ON public.workout_sets(workout_exercise_id);

CREATE INDEX IF NOT EXISTS idx_personal_records_user
  ON public.personal_records(user_id);

CREATE INDEX IF NOT EXISTS idx_personal_records_user_name
  ON public.personal_records(user_id, exercise_name); -- PR lookup by exercise

CREATE INDEX IF NOT EXISTS idx_exercises_muscle
  ON public.exercises(muscle_group);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records  ENABLE ROW LEVEL SECURITY;

-- profiles: users can only read/update their own row
CREATE POLICY "profiles: own row only"
  ON public.profiles FOR ALL
  USING     (auth.uid() = id)
  WITH CHECK(auth.uid() = id);

-- exercises: all authenticated users can read; only service_role can write
-- (the global exercise library is managed server-side, not by users)
CREATE POLICY "exercises: authenticated read"
  ON public.exercises FOR SELECT
  TO authenticated
  USING (true);

-- workouts: users can CRUD only their own workouts
CREATE POLICY "workouts: own rows only"
  ON public.workouts FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

-- workout_exercises: accessible if the parent workout belongs to the user
CREATE POLICY "workout_exercises: via own workout"
  ON public.workout_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_exercises.workout_id
        AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_exercises.workout_id
        AND w.user_id = auth.uid()
    )
  );

-- workout_sets: accessible if the grandparent workout belongs to the user
CREATE POLICY "workout_sets: via own workout"
  ON public.workout_sets FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.workout_exercises we
      JOIN public.workouts         w  ON w.id = we.workout_id
      WHERE we.id = workout_sets.workout_exercise_id
        AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workout_exercises we
      JOIN public.workouts         w  ON w.id = we.workout_id
      WHERE we.id = workout_sets.workout_exercise_id
        AND w.user_id = auth.uid()
    )
  );

-- personal_records: users can CRUD only their own PRs
CREATE POLICY "personal_records: own rows only"
  ON public.personal_records FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);


-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-bump profiles.updated_at on every UPDATE
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create a profile row when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- RPC: save_workout
-- Inserts a complete workout (exercises + sets) atomically.
-- Called from the TypeScript client on workout finish.
-- Returns the new workout UUID.
-- ============================================================
CREATE OR REPLACE FUNCTION public.save_workout(p_workout jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workout_id      uuid;
  v_exercise_row    jsonb;
  v_set_row         jsonb;
  v_exercise_id     uuid;
BEGIN
  -- ── Insert workout ────────────────────────────────────────────────────────
  INSERT INTO public.workouts (
    id,
    user_id,
    started_at,
    finished_at,
    duration_secs,
    total_volume_kg,
    total_sets,
    notes
  ) VALUES (
    COALESCE((p_workout->>'id')::uuid,          gen_random_uuid()),
    auth.uid(),
    (p_workout->>'started_at')::timestamptz,
    (p_workout->>'finished_at')::timestamptz,
    (p_workout->>'duration_secs')::integer,
    (p_workout->>'total_volume_kg')::numeric,
    (p_workout->>'total_sets')::integer,
    p_workout->>'notes'
  )
  RETURNING id INTO v_workout_id;

  -- ── Insert exercises + sets ───────────────────────────────────────────────
  FOR v_exercise_row IN
    SELECT value FROM jsonb_array_elements(p_workout->'exercises')
  LOOP
    INSERT INTO public.workout_exercises (
      workout_id,
      exercise_id,
      name,
      emoji,
      order_index
    ) VALUES (
      v_workout_id,
      NULLIF(v_exercise_row->>'exercise_id', '')::uuid,
      v_exercise_row->>'name',
      COALESCE(v_exercise_row->>'emoji', '🏋️'),
      COALESCE((v_exercise_row->>'order_index')::integer, 0)
    )
    RETURNING id INTO v_exercise_id;

    FOR v_set_row IN
      SELECT value FROM jsonb_array_elements(v_exercise_row->'sets')
    LOOP
      INSERT INTO public.workout_sets (
        workout_exercise_id,
        set_number,
        weight_kg,
        reps,
        one_rm,
        is_completed
      ) VALUES (
        v_exercise_id,
        (v_set_row->>'set_number')::integer,
        NULLIF(v_set_row->>'weight_kg', '')::numeric,
        NULLIF(v_set_row->>'reps',      '')::integer,
        NULLIF(v_set_row->>'one_rm',    '')::numeric,
        COALESCE((v_set_row->>'is_completed')::boolean, true)
      );
    END LOOP;
  END LOOP;

  RETURN v_workout_id;
END;
$$;


-- ============================================================
-- RPC: get_percentile_rank
-- Returns the calling user's volume rank for the current ISO week
-- as an integer representing "Top X%" (lower = better).
-- Uses PERCENT_RANK() window function over all users' weekly totals.
-- Called from the TypeScript client when rendering WorkoutShareCard.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_percentile_rank()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH week_volumes AS (
    -- Sum each user's total_volume_kg for the current ISO week
    SELECT
      user_id,
      COALESCE(SUM(total_volume_kg), 0)::numeric AS weekly_volume
    FROM public.workouts
    WHERE started_at >= date_trunc('week', now())
      AND started_at <  date_trunc('week', now()) + INTERVAL '1 week'
      AND finished_at IS NOT NULL
    GROUP BY user_id
  ),
  ranked AS (
    SELECT
      user_id,
      -- PERCENT_RANK() = fraction of rows with strictly lower volume.
      -- (1 - PERCENT_RANK()) * 100 = "Top X%" where lower X = better rank.
      CEIL((1.0 - PERCENT_RANK() OVER (ORDER BY weekly_volume)) * 100)::integer AS top_pct
    FROM week_volumes
  )
  SELECT GREATEST(1, COALESCE(top_pct, 60))
  FROM ranked
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;


-- ============================================================
-- SEED DATA: exercises library
-- Matches src/data/exercises.ts exactly (48 exercises) plus
-- adds equipment field. Emoji mirrors the getEmoji() logic in
-- CurrentWorkout.tsx and WorkoutDetail.tsx.
-- ============================================================
INSERT INTO public.exercises (name, muscle_group, equipment, emoji) VALUES
  -- Chest ─────────────────────────────────────────────────────────────────────
  ('Bench Press',           'Chest',          'barbell',    '🏋️'),
  ('Incline Bench Press',   'Upper Chest',    'barbell',    '🏋️'),
  ('Decline Bench Press',   'Lower Chest',    'barbell',    '🏋️'),
  ('Dumbbell Press',        'Chest',          'dumbbell',   '🏋️'),
  ('Dumbbell Fly',          'Chest',          'dumbbell',   '🏋️'),
  ('Cable Crossover',       'Chest',          'cable',      '🏋️'),
  ('Pec Deck',              'Chest',          'machine',    '🏋️'),
  ('Machine Chest Press',   'Chest',          'machine',    '🏋️'),
  ('Push-up',               'Chest',          'bodyweight', '💪'),
  ('Dips',                  'Chest',          'bodyweight', '💪'),
  -- Back ──────────────────────────────────────────────────────────────────────
  ('Deadlift',              'Back',           'barbell',    '💀'),
  ('Romanian Deadlift',     'Hamstrings',     'barbell',    '💪'),
  ('Sumo Deadlift',         'Legs',           'barbell',    '🦵'),
  ('Barbell Row',           'Back',           'barbell',    '💪'),
  ('T-Bar Row',             'Back',           'barbell',    '💪'),
  ('Pull-up',               'Back',           'bodyweight', '💪'),
  ('Chin-up',               'Back',           'bodyweight', '💪'),
  ('Lat Pulldown',          'Back',           'cable',      '💪'),
  ('Seated Cable Row',      'Back',           'cable',      '💪'),
  ('Inverted Row',          'Back',           'bodyweight', '💪'),
  -- Legs ──────────────────────────────────────────────────────────────────────
  ('Squat',                 'Legs',           'barbell',    '🦵'),
  ('Front Squat',           'Legs',           'barbell',    '🦵'),
  ('Hack Squat',            'Legs',           'machine',    '🦵'),
  ('Smith Machine Squat',   'Legs',           'machine',    '🦵'),
  ('Leg Press',             'Legs',           'machine',    '🦵'),
  ('Seated Leg Press',      'Legs',           'machine',    '🦵'),
  ('Leg Extension',         'Quadriceps',     'machine',    '🦵'),
  ('Leg Curl',              'Hamstrings',     'machine',    '🦵'),
  ('Lunges',                'Legs',           'dumbbell',   '🦵'),
  ('Bulgarian Split Squat', 'Legs',           'dumbbell',   '🦵'),
  ('Hip Thrust',            'Glutes',         'barbell',    '🦵'),
  ('Calf Raise',            'Calves',         'machine',    '⚡'),
  -- Shoulders ─────────────────────────────────────────────────────────────────
  ('Overhead Press',        'Shoulders',      'barbell',    '🔥'),
  ('Shoulder Press',        'Shoulders',      'dumbbell',   '🔥'),
  ('Arnold Press',          'Shoulders',      'dumbbell',   '🔥'),
  ('Lateral Raise',         'Shoulders',      'dumbbell',   '🔥'),
  ('Front Raise',           'Shoulders',      'dumbbell',   '🔥'),
  ('Face Pull',             'Shoulders',      'cable',      '🔥'),
  ('Upright Row',           'Shoulders',      'barbell',    '🔥'),
  ('Reverse Fly',           'Rear Deltoids',  'dumbbell',   '🔥'),
  -- Arms ──────────────────────────────────────────────────────────────────────
  ('Barbell Curl',          'Biceps',         'barbell',    '💪'),
  ('Dumbbell Curl',         'Biceps',         'dumbbell',   '💪'),
  ('Hammer Curl',           'Biceps',         'dumbbell',   '💪'),
  ('EZ Bar Curl',           'Biceps',         'barbell',    '💪'),
  ('Preacher Curl',         'Biceps',         'machine',    '💪'),
  ('Tricep Pushdown',       'Triceps',        'cable',      '💪'),
  ('Skull Crusher',         'Triceps',        'barbell',    '💪'),
  ('Tricep Extension',      'Triceps',        'dumbbell',   '💪'),
  -- Traps / Core / Full Body ───────────────────────────────────────────────────
  ('Shrug',                 'Traps',          'barbell',    '💪'),
  ('Plank',                 'Core',           'bodyweight', '⚡'),
  ('Kettlebell Swing',      'Full Body',      'kettlebell', '🔥')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- SUPABASE STORAGE — exercise-images bucket
-- ============================================================
--
-- Bucket name : exercise-images
-- Access      : PUBLIC  (images are global, not user-specific)
-- Folder path : {exercise_id}/
--               ├── original.webp   — full-res source (e.g. 1200×1200px, ≤2 MB)
--               └── thumbnail.webp  — display size   (e.g.  400×400px,  ≤200 KB)
--
-- image_url in exercises table → public URL of thumbnail.webp
--   e.g. https://<ref>.supabase.co/storage/v1/object/public/exercise-images/<id>/thumbnail.webp
--
-- image_path in exercises table → bucket-relative path for updates / deletion
--   e.g. <exercise_id>/thumbnail.webp
--
-- Recommended format : WebP (smaller than JPEG at equivalent quality)
-- Fallback format    : JPEG (for tooling compatibility)
-- Max file size      : 2 MB (original), 200 KB (thumbnail)
-- Recommended dims   : 400×400 thumbnail (1:1 square), 1200×1200 original
--
-- To create this bucket via the Supabase dashboard:
--   Storage → New bucket → "exercise-images" → Public → Create
-- Or via SQL:
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('exercise-images', 'exercise-images', true)
--   ON CONFLICT DO NOTHING;
--
-- Storage policy (allow public reads — already implicit for public buckets):
-- CREATE POLICY "exercise images: public read"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'exercise-images');
