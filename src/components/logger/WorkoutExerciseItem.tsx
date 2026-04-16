import Card from '@/components/general/Card';
import SetItem from './SetItem';
import CustomButton from '@/components/general/CustomButton';
import { ExerciseWithSets } from '@/types/models';
import useStore from '@/store';

type WorkoutExerciseItemProps = {
  exercise: ExerciseWithSets;
};

export default function WorkoutExerciseItem({ exercise }: WorkoutExerciseItemProps) {
  const addSet = useStore((state) => state.addSet);

  return (
    <Card title={exercise.name}>
      <div className="flex items-center gap-2 my-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="font-semibold w-6 shrink-0">Set</span>
        <span className="flex-1 text-center font-semibold">kg</span>
        <span className="flex-1 text-center font-semibold">Reps</span>
        <span className="w-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        {exercise.sets.map((item, index) => (
          <SetItem key={item.id} index={index} set={item} />
        ))}
      </div>
      <CustomButton
        onClick={() => addSet(exercise.id)}
        variant="link"
        title="+ Add set"
        className="py-2.5 mt-2"
      />
    </Card>
  );
}
