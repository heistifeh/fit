import { useParams } from 'react-router-dom';
import PageHeader from '@/components/general/PageHeader';
import WorkoutExerciseItem from '@/components/workouts/WorkoutExerciseItem';
import useStore from '@/store';
import dayjs from 'dayjs';

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>();
  const workout = useStore((state) => state.workouts.find((w) => w.id === id));

  if (!workout) {
    return <p className="text-center mt-10 text-gray-400">Workout not found</p>;
  }

  return (
    <div className="flex flex-col gap-2.5 px-4">
      <PageHeader title="Workout details" showBack />
      <p className="text-lg text-gray-500 -mt-2 mb-2">
        {dayjs(workout.createdAt).format('HH:mm dddd, D MMM')}
      </p>
      <div className="flex flex-col gap-2">
        {workout.exercises.map((exercise) => (
          <WorkoutExerciseItem key={exercise.id} exercise={exercise} />
        ))}
      </div>
    </div>
  );
}
