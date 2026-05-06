import exerciseList from '@/data/exercises';

export type MuscleGroup =
  | 'Chest' | 'Back' | 'Legs' | 'Shoulders'
  | 'Biceps' | 'Triceps' | 'Arms'
  | 'Core' | 'Full Body' | 'Glutes' | 'Hamstrings'
  | 'Quadriceps' | 'Calves' | 'Traps'
  | 'Upper Chest' | 'Lower Chest' | 'Rear Deltoids'
  | 'Cardio' | string;

export const getMuscleColor = (
  muscleGroup: string,
  darkMode = false,
): { bg: string; stroke: string } => {
  const g = muscleGroup?.toLowerCase() ?? '';
  if (g.includes('chest')) return darkMode
    ? { bg: '#2d1515', stroke: '#ef4444' }
    : { bg: '#fef2f2', stroke: '#ef4444' };
  if (g.includes('back') || g.includes('trap')) return darkMode
    ? { bg: '#172034', stroke: '#3b82f6' }
    : { bg: '#eff6ff', stroke: '#3b82f6' };
  if (g.includes('leg') || g.includes('quad') || g.includes('glute') || g.includes('hamstring') || g.includes('calf') || g.includes('calve')) return darkMode
    ? { bg: '#1e1730', stroke: '#8b5cf6' }
    : { bg: '#f5f3ff', stroke: '#8b5cf6' };
  if (g.includes('shoulder') || g.includes('delt')) return darkMode
    ? { bg: '#2d1a0a', stroke: '#f97316' }
    : { bg: '#fff7ed', stroke: '#f97316' };
  if (g.includes('bicep') || g.includes('tricep') || g.includes('arm')) return darkMode
    ? { bg: '#0d2e22', stroke: '#10B981' }
    : { bg: '#f0fdf4', stroke: '#10B981' };
  if (g.includes('core')) return darkMode
    ? { bg: '#2a2000', stroke: '#eab308' }
    : { bg: '#fefce8', stroke: '#eab308' };
  if (g.includes('full') || g.includes('cardio')) return darkMode
    ? { bg: '#22103a', stroke: '#a855f7' }
    : { bg: '#fdf4ff', stroke: '#a855f7' };
  return darkMode
    ? { bg: '#1a1a1a', stroke: '#6b7280' }
    : { bg: '#f3f4f6', stroke: '#6b7280' };
};

// Look up muscle group from exercise name — exact match first, then keyword inference.
export const getMuscleFromName = (name: string): string => {
  const found = exerciseList.find((e) => e.name.toLowerCase() === name.toLowerCase());
  if (found) return found.muscle;

  const n = name.toLowerCase();
  if (n.includes('sumo')) return 'Legs';
  if (n.includes('hip thrust')) return 'Glutes';
  if (n.includes('upright row')) return 'Shoulders';
  if (n.includes('reverse fly')) return 'Rear Deltoids';
  if (n.includes('overhead') || n.includes('shoulder') || n.includes('lateral') || n.includes('delt') || n.includes('front raise') || n.includes('face pull') || n.includes('arnold')) return 'Shoulders';
  if (n.includes('bench') || n.includes('pec') || n.includes('chest') || n.includes('fly') || n.includes('dip') || n.includes('push-up') || n.includes('pushup') || n.includes('crossover')) return 'Chest';
  if (n.includes('deadlift') || n.includes('row') || n.includes('pulldown') || n.includes('pull-up') || n.includes('pullup') || n.includes('chin-up') || n.includes('chinup') || n.includes('shrug') || n.includes('trap')) return 'Back';
  if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('glute') || n.includes('hamstring') || n.includes('calf') || n.includes('calve') || n.includes('rdl')) return 'Legs';
  if (n.includes('curl') || n.includes('bicep') || n.includes('preacher')) return 'Biceps';
  if (n.includes('tricep') || n.includes('skull') || n.includes('pushdown') || n.includes('extension')) return 'Triceps';
  if (n.includes('plank') || n.includes('crunch') || n.includes('core') || n.includes(' ab') || n.includes('situp') || n.includes('sit-up')) return 'Core';
  if (n.includes('cardio') || n.includes('kettlebell') || n.includes('swing') || n.includes('burpee')) return 'Full Body';
  return '';
};
