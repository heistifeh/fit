import { int, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const workouts = sqliteTable('workouts', {
  id: text('id').primaryKey(),
  createdAt: text('created_at').notNull(),
  finishedAt: text('finished_at'),
});

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  workoutId: text('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
});

export const exerciseSets = sqliteTable('exercise_sets', {
  id: text('id').primaryKey(),
  exerciseId: text('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  reps: int('reps'),
  weight: real('weight'),
  oneRm: real('one_rm'),
});

export const workoutsRelations = relations(workouts, ({ many }) => ({
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  workout: one(workouts, { fields: [exercises.workoutId], references: [workouts.id] }),
  sets: many(exerciseSets),
}));

export const exerciseSetsRelations = relations(exerciseSets, ({ one }) => ({
  exercise: one(exercises, { fields: [exerciseSets.exerciseId], references: [exercises.id] }),
}));
