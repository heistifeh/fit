import { ExerciseSet, WorkoutWithExercises } from "@/types/models";
import { create } from "zustand";
import * as Crypto from "expo-crypto";
import { createExercise } from "@/services/exerciseService";
import { immer } from "zustand/middleware/immer";
import { createSet, updateSet } from "@/services/setService";
import { finishWorkout } from "@/services/workoutService";
import { getWorkouts } from "@/db/workout";

type State = {
  currentWorkout: WorkoutWithExercises | null;
  workouts: WorkoutWithExercises[];
};

type Actions = {
  startWorkout: () => void;
  endWorkout: () => void;
  loadWorkouts: () => Promise<void>;
  addExercise: (name: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (
    setId: string,
    updatedFields: Pick<ExerciseSet, "reps" | "weight">,
  ) => void;
  deleteSet: (setId: string) => void;
};

const useStore = create<State & Actions>()(
  immer((set, get) => ({
    currentWorkout: null,
    workouts: [],
    startWorkout: () => {
      const newWorkout: WorkoutWithExercises = {
        id: Crypto.randomUUID(),
        createdAt: new Date(),
        finishedAt: null,
        exercises: [],
      };
      set({ currentWorkout: newWorkout });
    },

    loadWorkouts: async () => {
      const data = await getWorkouts();
      set({ workouts: data });
    },

    endWorkout: async () => {
      const { currentWorkout } = get();
      if (!currentWorkout) return;
      const finishedWorkout = await finishWorkout(currentWorkout);
      set((state) => {
        state.currentWorkout = null;
        state.workouts.unshift(finishedWorkout);
      });
    },
    addExercise: (name: string) => {
      const { currentWorkout } = get();
      if (!currentWorkout) return;
      const newExercise = createExercise(name, currentWorkout.id);
      set((state) => {
        state.currentWorkout?.exercises.push(newExercise);
      });
    },

    addSet: (exerciseId) => {
      const newSet = createSet(exerciseId);

      set(({ currentWorkout }) => {
        const exercise = currentWorkout?.exercises.find(
          (e) => e.id === exerciseId,
        );

        exercise?.sets?.push(newSet);
      });
    },
    updateSet: (setId, updatedFields) => {
      set(({ currentWorkout }) => {
        currentWorkout?.exercises.forEach((exercise) => {
          const setIndex = exercise.sets.findIndex((s) => s.id === setId);
          if (setIndex === -1) return;

          const updatedSet = updateSet(exercise.sets[setIndex], updatedFields);

          exercise.sets[setIndex] = updatedSet;
        });
      });
    },
    deleteSet(setId) {
      set(({ currentWorkout }) => {
        currentWorkout?.exercises.forEach((exercise) => {
          const setIndex = exercise.sets.findIndex((s) => s.id === setId);
          if (setIndex === -1) return;

          exercise.sets.splice(setIndex, 1);
        });

        if (currentWorkout) {
          currentWorkout.exercises = currentWorkout.exercises.filter(
            (e) => e.sets.length > 0
          );
        }
      });
    },
  })),
);

export default useStore;
