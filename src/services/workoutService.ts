import { WorkoutWithExercises } from '@/types/models';
import { cleanExercise, getExerciseTotalWeight } from '@/services/exerciseService';
import { saveWorkout } from '@/db/workout';

export const getWorkoutTotalWeight = (workout: WorkoutWithExercises) => {
  return workout.exercises.reduce(
    (total, exercise) => total + getExerciseTotalWeight(exercise),
    0
  );
};


export const finishWorkout = async (currentWorkout: WorkoutWithExercises) => {

  const cleanedWorkout = cleanWorkout(currentWorkout);
  const finishedWorkout: WorkoutWithExercises = {
      ...cleanedWorkout,
      finishedAt: new Date(),
    };

    await saveWorkout(finishedWorkout);
    return finishedWorkout;
}

export const cleanWorkout = (workout: WorkoutWithExercises) => {
  const cleanedExercises = workout.exercises.map(cleanExercise).filter((e)=> e !== null);
return{
  ...workout,
  exercises: cleanedExercises,
}
}