import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Dumbbell } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import useStore from '@/store';
import exerciseList from '@/data/exercises';
import { slideRight } from '@/animations/fitnex.variants';
import { usePreferences } from '@/context/PreferencesContext';
import ExerciseIcon from '@/components/ExerciseIcon';

export default function AddExercise() {
  usePageTitle('Add exercise');
  const navigate = useNavigate();
  const addExercise = useStore((s) => s.addExercise);
  const currentWorkout = useStore((s) => s.currentWorkout);
  const { darkMode } = usePreferences();

  const [search, setSearch] = useState('');
  // Guards against a stray double-fire adding the exercise twice before the
  // back-navigation unmounts this page.
  const addingRef = useRef(false);

  if (!currentWorkout) navigate('/', { replace: true });

  const filtered = exerciseList.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePick = (name: string) => {
    if (addingRef.current) return;
    addingRef.current = true;
    addExercise(name);
    navigate(-1);
  };

  return (
    <motion.div
      className="flex flex-col min-h-dvh bg-[#f8f9fa] dark:bg-[#0a0a0a]"
      variants={slideRight}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <header className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-[#1a1a1a] px-3 pt-10 pb-3 sticky top-0 z-20">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="p-3 -ml-1 text-gray-500 dark:text-[#888] active:text-gray-900 dark:active:text-white"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-[18px] font-black dark:text-white">Add exercise</h1>
        </div>

        <div className="relative mt-3">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-3 pl-11 pr-4 bg-gray-100 dark:bg-[#222] text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-tint placeholder:text-gray-400 dark:placeholder:text-[#555]"
          />
        </div>
      </header>

      <div className="flex-1 px-4 py-3" style={{ touchAction: 'pan-y' }}>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16">
            <Dumbbell size={32} color="#9ca3af" />
            <p className="text-center text-gray-400">No exercises found</p>
          </div>
        )}

        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => handlePick(ex.name)}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            className="w-full text-left flex items-center gap-3 py-3 border-b border-gray-100 dark:border-[#1a1a1a] last:border-0 active:bg-gray-50 dark:active:bg-[#161616] rounded-lg"
          >
            <ExerciseIcon muscleGroup={ex.muscle} size={36} darkMode={darkMode} />
            <div>
              <p className="font-semibold text-sm dark:text-white">{ex.name}</p>
              <p className="text-xs text-gray-400">{ex.muscle}</p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
