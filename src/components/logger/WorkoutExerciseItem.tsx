import { AnimatePresence, motion } from 'framer-motion';
import Card from '@/components/general/Card';
import SetItem from './SetItem';
import CustomButton from '@/components/general/CustomButton';
import { ExerciseWithSets } from '@/types/models';
import useStore from '@/store';

type WorkoutExerciseItemProps = {
  exercise: ExerciseWithSets;
};

const setRowVariant = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' as const },
  exit:    { opacity: 0, height: 0 },
};

export default function WorkoutExerciseItem({ exercise }: WorkoutExerciseItemProps) {
  const addSet   = useStore((state) => state.addSet);
  const cloneSet = useStore((state) => state.cloneSet);

  // Last completed set (reps > 0) — used for "Add set" placeholder pre-fill
  const lastCompleted = [...exercise.sets]
    .reverse()
    .find((s) => s.reps && s.reps > 0);

  return (
    <Card title={exercise.name}>
      <div className="flex items-center gap-2 my-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="font-semibold w-6 shrink-0">Set</span>
        <span className="flex-1 text-center font-semibold">kg</span>
        <span className="flex-1 text-center font-semibold">Reps</span>
        <span className="w-[88px]" /> {/* wider to accommodate Repeat pill */}
      </div>

      <div className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {exercise.sets.map((item, index) => {
            // Preceding completed set for this row's placeholder
            const prevCompleted = exercise.sets
              .slice(0, index)
              .reverse()
              .find((s) => s.reps && s.reps > 0);

            return (
              <motion.div
                key={item.id}
                variants={setRowVariant}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ overflow: 'hidden' }}
              >
                <SetItem
                  index={index}
                  set={item}
                  placeholderWeight={prevCompleted?.weight?.toString()}
                  placeholderReps={prevCompleted?.reps?.toString()}
                  onClone={
                    item.reps && item.reps > 0
                      ? () => cloneSet(exercise.id, item.weight ?? 0, item.reps ?? 0)
                      : undefined
                  }
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
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
