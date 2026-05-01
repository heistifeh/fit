import { ExerciseSet } from '@/types/models';

export const calculate1RM = (weightKg: number, reps: number): number | null => {
  if (!weightKg || !reps || reps <= 0 || weightKg <= 0) return null;
  if (reps === 1) return weightKg;
  if (reps >= 37) return null;
  return Math.round(weightKg * (36 / (37 - reps)) * 10) / 10;
};

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
    updatedSet.oneRM = calculate1RM(updatedSet.weight, updatedSet.reps) ?? undefined;
  }
  return updatedSet;
};

const isComplete = (set: ExerciseSet) => !!(set.reps && set.reps > 0);

export const cleanSets = (sets: ExerciseSet[]) => sets.filter(isComplete);
