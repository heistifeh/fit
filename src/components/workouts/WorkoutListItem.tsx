import { Link } from 'react-router-dom';
import { Clock, Zap } from 'lucide-react';
import { WorkoutWithExercises } from '@/types/models';
import dayjs from 'dayjs';
import { getWorkoutTotalWeight } from '@/services/workoutService';
import { calculateDuration } from '@/utils/time';

type WorkoutListItemProps = {
  workout: WorkoutWithExercises;
};

export default function WorkoutListItem({ workout }: WorkoutListItemProps) {
  const totalWeight = getWorkoutTotalWeight(workout);
  const duration    = calculateDuration(workout.createdAt, workout.finishedAt);

  const preview   = workout.exercises.slice(0, 3).map((e) => e.name).join(' · ');
  const remaining = workout.exercises.length - 3;

  return (
    <Link to={`/workout/${workout.id}`} className="block active:opacity-70 transition-opacity">
      <div className="bg-gray-50 dark:bg-zinc-900 rounded-2xl p-4">

        {/* Date + duration */}
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-[15px]">
            {dayjs(workout.createdAt).format('ddd, D MMM')}
          </p>
          <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
            <Clock size={12} />
            {duration}
          </span>
        </div>

        {/* Exercise preview */}
        <p className="text-sm text-gray-500 mb-3 leading-snug">
          {preview || 'No exercises'}
          {remaining > 0 && (
            <span className="text-tint dark:text-tint-dark font-semibold"> +{remaining} more</span>
          )}
        </p>

        {/* Stat pills */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-full px-2.5 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
            <Zap size={11} className="text-tint dark:text-tint-dark" />
            {totalWeight.toLocaleString()} kg
          </span>
          <span className="flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-full px-2.5 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
            {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
          </span>
        </div>

      </div>
    </Link>
  );
}
