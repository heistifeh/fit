import { useState } from 'react';
import { X } from 'lucide-react';
import CustomButton from '@/components/general/CustomButton';
import exercises from '@/data/exercises';

type SelectExerciseModalProps = {
  onSelectExercise: (name: string) => void;
};

export default function SelectExerciseModal({ onSelectExercise }: SelectExerciseModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const close = () => {
    setIsOpen(false);
    setSearch('');
  };

  return (
    <>
      <CustomButton
        title="+ Add exercise"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="mb-4"
      />

      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={close}
          />

          {/* Sheet / Modal */}
          <div className="relative animate-slide-up sm:animate-none bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl w-full sm:w-11/12 sm:max-w-md flex flex-col"
               style={{ maxHeight: '88vh' }}>

            {/* Drag handle (mobile only) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 dark:bg-zinc-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-lg font-bold">Select exercise</p>
              <button
                onClick={close}
                className="p-2 -mr-2 text-gray-400 active:text-gray-700 dark:active:text-gray-200 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search — sticky inside the sheet */}
            <div className="px-5 pb-3">
              <input
                type="text"
                placeholder="Search exercises..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full py-3 px-4 bg-gray-100 dark:bg-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-tint dark:focus:ring-tint-dark placeholder:text-gray-400"
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 px-5 pb-8">
              {filtered.length === 0 && (
                <p className="text-center text-gray-400 py-10">No exercises found</p>
              )}
              {filtered.map((exercise) => (
                <button
                  key={exercise.name}
                  onClick={() => {
                    onSelectExercise(exercise.name);
                    close();
                  }}
                  className="w-full text-left flex flex-col py-3.5 border-b border-gray-100 dark:border-zinc-800 last:border-0 active:bg-gray-50 dark:active:bg-zinc-800 -mx-1 px-1 rounded-lg"
                >
                  <span className="font-semibold">{exercise.name}</span>
                  <span className="text-sm text-gray-500 mt-0.5">{exercise.muscle}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
