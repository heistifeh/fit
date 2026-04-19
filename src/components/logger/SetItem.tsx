import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ExerciseSet } from '@/types/models';
import useStore from '@/store';

type SetItemProps = {
  index: number;
  set: ExerciseSet;
  placeholderWeight?: string;
  placeholderReps?: string;
  onClone?: () => void;
};

function RepeatIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  );
}

export default function SetItem({
  index,
  set,
  placeholderWeight,
  placeholderReps,
  onClone,
}: SetItemProps) {
  const [weight, setWeight] = useState(set.weight?.toString() || '');
  const [reps,   setReps]   = useState(set.reps?.toString()   || '');
  const updateSet = useStore((state) => state.updateSet);
  const deleteSet = useStore((state) => state.deleteSet);

  const isCompleted = !!(set.reps && set.reps > 0);

  return (
    <div className="flex items-center gap-2">
      {/* Set number */}
      <span className="font-bold text-base w-6 shrink-0">{index + 1}</span>

      {/* Weight */}
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholderWeight ?? '0'}
        value={weight}
        onChange={(e) => {
          const v = e.target.value;
          if (/^\d*\.?\d*$/.test(v)) setWeight(v);
        }}
        onBlur={() => updateSet(set.id, { weight: parseFloat(weight) || 0 })}
        className="flex-1 py-3 px-2 text-center text-base bg-gray-100 dark:bg-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-tint dark:focus:ring-tint-dark"
      />

      {/* Reps */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder={placeholderReps ?? '8'}
        value={reps}
        onChange={(e) => {
          const v = e.target.value;
          if (/^\d*$/.test(v)) setReps(v);
        }}
        onKeyDown={(e) => {
          if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
        }}
        onBlur={() => updateSet(set.id, { reps: parseInt(reps) || 0 })}
        className="flex-1 py-3 px-2 text-center text-base bg-gray-100 dark:bg-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-tint dark:focus:ring-tint-dark"
      />

      {/* Action: Repeat pill (completed) or Delete (incomplete) */}
      {isCompleted && onClone ? (
        <button
          onClick={onClone}
          style={{
            background: '#f3f4f6',
            border: 'none',
            borderRadius: 8,
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <RepeatIcon />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>Repeat</span>
        </button>
      ) : (
        <button
          onClick={() => deleteSet(set.id)}
          className="p-3 -mr-1 text-red-400 active:text-red-600"
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
}
