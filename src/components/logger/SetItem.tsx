import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ExerciseSet } from '@/types/models';
import useStore from '@/store';

type SetItemProps = {
  index: number;
  set: ExerciseSet;
};

export default function SetItem({ index, set }: SetItemProps) {
  const [weight, setWeight] = useState(set.weight?.toString() || '');
  const [reps, setReps] = useState(set.reps?.toString() || '');
  const updateSet = useStore((state) => state.updateSet);
  const deleteSet = useStore((state) => state.deleteSet);

  return (
    <div className="flex items-center gap-2">
      <span className="font-bold text-base w-6 shrink-0">{index + 1}</span>
      <input
        type="text"
        inputMode="decimal"
        placeholder="50"
        value={weight}
        onChange={(e) => {
          const v = e.target.value;
          if (/^\d*\.?\d*$/.test(v)) setWeight(v);
        }}
        onBlur={() => updateSet(set.id, { weight: parseFloat(weight) || 0 })}
        className="flex-1 py-3 px-2 text-center text-base bg-gray-100 dark:bg-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-tint dark:focus:ring-tint-dark"
      />
      <input
        type="text"
        inputMode="numeric"
        placeholder="8"
        value={reps}
        onChange={(e) => {
          const v = e.target.value;
          if (/^\d*$/.test(v)) setReps(v);
        }}
        onBlur={() => updateSet(set.id, { reps: parseInt(reps) || 0 })}
        className="flex-1 py-3 px-2 text-center text-base bg-gray-100 dark:bg-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-tint dark:focus:ring-tint-dark"
      />
      <button
        onClick={() => deleteSet(set.id)}
        className="p-3 -mr-1 text-red-400 active:text-red-600"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
