export type Badge = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  earned: boolean;
};

export const getBadges = (stats: {
  workoutCount: number;
  streak: number;
  hasPR: boolean;
  hasEarlyWorkout: boolean; // any workout started before 7am
}): Badge[] => [
  {
    id: 'workouts_10',
    emoji: '🦁',
    name: '10 workouts',
    description: 'Complete 10 workouts',
    earned: stats.workoutCount >= 10,
  },
  {
    id: 'first_pr',
    emoji: '🏆',
    name: 'First PR',
    description: 'Set your first personal record',
    earned: stats.hasPR,
  },
  {
    id: 'streak_7',
    emoji: '🔥',
    name: '7 day streak',
    description: 'Work out 7 days in a row',
    earned: stats.streak >= 7,
  },
  {
    id: 'early_bird',
    emoji: '⚡',
    name: 'Early bird',
    description: 'Complete a workout before 7am',
    earned: stats.hasEarlyWorkout,
  },
  {
    id: 'workouts_100',
    emoji: '💯',
    name: '100 workouts',
    description: 'Complete 100 workouts',
    earned: stats.workoutCount >= 100,
  },
  {
    id: 'streak_30',
    emoji: '💎',
    name: '30 day streak',
    description: 'Work out 30 days in a row',
    earned: stats.streak >= 30,
  },
];
