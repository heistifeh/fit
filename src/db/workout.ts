import { db } from '@/db';
import { workouts, exercises, exerciseSets } from '@/db/schema';
import { WorkoutWithExercises } from '@/types/models';

export const getWorkouts = async (): Promise<WorkoutWithExercises[]> => {
  const rows = await db.query.workouts.findMany({
    with: {
      exercises: {
        with: {
          sets: true,
        },
      },
    },
    orderBy: (workouts, { desc }) => [desc(workouts.createdAt)],
  });

  return rows.map((w) => ({
    id: w.id,
    createdAt: new Date(w.createdAt),
    finishedAt: w.finishedAt ? new Date(w.finishedAt) : null,
    exercises: w.exercises.map((e) => ({
      id: e.id,
      workoutId: e.workoutId,
      name: e.name,
      sets: e.sets.map((s) => ({
        id: s.id,
        exerciseId: s.exerciseId,
        reps: s.reps ?? undefined,
        weight: s.weight ?? undefined,
        oneRM: s.oneRm ?? undefined,
      })),
    })),
  }));
};

export const saveWorkout = async (workout: WorkoutWithExercises) => {
  await db.insert(workouts).values({
    id: workout.id,
    createdAt: workout.createdAt.toISOString(),
    finishedAt: workout.finishedAt?.toISOString() ?? null,
  });

  for (const exercise of workout.exercises) {
    await db.insert(exercises).values({
      id: exercise.id,
      workoutId: workout.id,
      name: exercise.name,
    });

    for (const set of exercise.sets) {
      await db.insert(exerciseSets).values({
        id: set.id,
        exerciseId: exercise.id,
        reps: set.reps ?? null,
        weight: set.weight ?? null,
        oneRm: set.oneRM ?? null,
      });
    }
  }
};
