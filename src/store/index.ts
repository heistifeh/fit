import { ExerciseSet, WorkoutWithExercises } from '@/types/models';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createExercise } from '@/services/exerciseService';
import { createSet, updateSet } from '@/services/setService';
import { finishWorkout } from '@/services/workoutService';

type State = {
  currentWorkout: WorkoutWithExercises | null;
  workouts: WorkoutWithExercises[];
};

type Actions = {
  startWorkout: () => void;
  endWorkout: () => void;
  discardWorkout: () => void;
  addExercise: (name: string) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (setId: string, updatedFields: Pick<ExerciseSet, 'reps' | 'weight'>) => void;
  deleteSet: (setId: string) => void;
};

// Revive date strings back to Date objects after loading from localStorage
const reviveDates = (workout: WorkoutWithExercises): WorkoutWithExercises => ({
  ...workout,
  createdAt: new Date(workout.createdAt),
  finishedAt: workout.finishedAt ? new Date(workout.finishedAt) : null,
});

const useStore = create<State & Actions>()(
  persist(
    immer((set, get) => ({
      currentWorkout: null,
      workouts: [],

      startWorkout: () => {
        const newWorkout: WorkoutWithExercises = {
          id: crypto.randomUUID(),
          createdAt: new Date(),
          finishedAt: null,
          exercises: [],
        };
        set({ currentWorkout: newWorkout });
      },

      endWorkout: () => {
        const { currentWorkout } = get();
        if (!currentWorkout) return;
        const finished = finishWorkout(currentWorkout);
        set((state) => {
          state.currentWorkout = null;
          if (finished.exercises.length > 0) {
            state.workouts.unshift(finished);
          }
        });
      },

      discardWorkout: () => {
        set({ currentWorkout: null });
      },

      removeExercise: (exerciseId: string) => {
        set(({ currentWorkout }) => {
          if (!currentWorkout) return;
          currentWorkout.exercises = currentWorkout.exercises.filter(
            (e) => e.id !== exerciseId
          );
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
          const exercise = currentWorkout?.exercises.find((e) => e.id === exerciseId);
          exercise?.sets.push(newSet);
        });
      },

      updateSet: (setId, updatedFields) => {
        set(({ currentWorkout }) => {
          currentWorkout?.exercises.forEach((exercise) => {
            const idx = exercise.sets.findIndex((s) => s.id === setId);
            if (idx === -1) return;
            exercise.sets[idx] = updateSet(exercise.sets[idx], updatedFields);
          });
        });
      },

      deleteSet: (setId) => {
        set(({ currentWorkout }) => {
          currentWorkout?.exercises.forEach((exercise) => {
            const idx = exercise.sets.findIndex((s) => s.id === setId);
            if (idx !== -1) exercise.sets.splice(idx, 1);
          });
          if (currentWorkout) {
            currentWorkout.exercises = currentWorkout.exercises.filter(
              (e) => e.sets.length > 0
            );
          }
        });
      },
    })),
    {
      name: 'fitnex-storage',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.workouts = state.workouts.map(reviveDates);
        if (state.currentWorkout) {
          state.currentWorkout = reviveDates(state.currentWorkout);
        }
      },
    }
  )
);

export default useStore;
