import Card from '@/components/general/Card';
import { ExerciseWithSets } from '@/types/models';
import { getBestSet } from '@/services/setService';
import Colors from '@/constants/Colors';

type WorkoutExerciseItemProps = {
  exercise: ExerciseWithSets;
};

export default function WorkoutExerciseItem({ exercise }: WorkoutExerciseItemProps) {
  const bestSet = getBestSet(exercise.sets);

  return (
    <Card title={exercise.name}>
      {exercise.sets.map((exerciseSet, index) => (
        <div
          key={exerciseSet.id}
          className="flex gap-4 p-2 rounded"
          style={{
            backgroundColor:
              exerciseSet.id === bestSet?.id ? Colors.dark.tint + '50' : 'transparent',
          }}
        >
          <span className="text-base text-gray-400">{index + 1}</span>
          <span className="text-base">
            {exerciseSet.reps}{' '}
            {exerciseSet.weight ? `x ${exerciseSet.weight} kg` : 'reps'}
          </span>
          {exerciseSet.oneRM && (
            <span className="text-base font-bold ml-auto">
              {Math.floor(exerciseSet.oneRM)} kg
            </span>
          )}
        </div>
      ))}
    </Card>
  );
}
