import { WorkoutWithExercises } from '@/types/models';
import { cleanExercise, getExerciseTotalWeight } from '@/services/exerciseService';

export const getWorkoutTotalWeight = (workout: WorkoutWithExercises) => {
  return workout.exercises.reduce(
    (total, exercise) => total + getExerciseTotalWeight(exercise),
    0
  );
};

export const cleanWorkout = (workout: WorkoutWithExercises) => {
  const cleanedExercises = workout.exercises.map(cleanExercise).filter((e) => e !== null);
  return { ...workout, exercises: cleanedExercises };
};

export const finishWorkout = (currentWorkout: WorkoutWithExercises): WorkoutWithExercises => {
  const cleaned = cleanWorkout(currentWorkout);
  return { ...cleaned, finishedAt: new Date() };
};
