import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { calculateDurationHourMinutes } from '@/utils/time';
import useStore from '@/store';

export default function WorkoutHeader() {
  const [timer, setTimer] = useState('0:00');
  const workout = useStore((state) => state.currentWorkout);

  useEffect(() => {
    const interval = setInterval(() => {
      const duration = calculateDurationHourMinutes(
        new Date(workout?.createdAt || ''),
        new Date()
      );
      setTimer(duration);
    }, 1000);
    return () => clearInterval(interval);
  }, [workout]);

  return (
    <div className="mb-5 py-2">
      <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-1">
        In progress
      </p>
      <div className="flex items-end gap-3">
        <p className="text-3xl font-black tabular-nums text-gray-900 dark:text-white">
          {timer}
        </p>
        <p className="flex items-center gap-1 text-gray-400 pb-1">
          <Clock size={15} />
          <span className="text-sm">elapsed</span>
        </p>
      </div>
    </div>
  );
}
