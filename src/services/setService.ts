import { ExerciseSet } from '@/types/models';

export const getBestSet = (sets: ExerciseSet[]) => {
  return sets.reduce((bestSet: ExerciseSet | null, set) => {
    return (set?.oneRM || 0) > (bestSet?.oneRM || 0) ? set : bestSet;
  }, null);
};

export const getSetTotalWeight = (set: ExerciseSet) => {
  return (set.weight || 0) * (set.reps || 0);
};

export const createSet = (exerciseId: string): ExerciseSet => {
  return { id: crypto.randomUUID(), exerciseId };
};

export const updateSet = (
  set: ExerciseSet,
  updatedFields: Pick<ExerciseSet, 'reps' | 'weight'>
): ExerciseSet => {
  const updatedSet = { ...set };
  if (updatedFields.reps !== undefined) updatedSet.reps = updatedFields.reps;
  if (updatedFields.weight !== undefined) updatedSet.weight = updatedFields.weight;
  if (updatedSet.weight && updatedSet.reps) {
    updatedSet.oneRM = Math.round(updatedSet.weight * (36.0 / (37.0 - updatedSet.reps)));
  }
  return updatedSet;
};

const isComplete = (set: ExerciseSet) => !!(set.reps && set.reps > 0);

export const cleanSets = (sets: ExerciseSet[]) => sets.filter(isComplete);
