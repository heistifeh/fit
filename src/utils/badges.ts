import type React from 'react';
import { Flame, Trophy, Medal, Sunrise, Gem, Dumbbell } from 'lucide-react';

export type Badge = {
  id: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  iconColor: string;
  iconBg: string;
  iconBgDark: string;
  name: string;
  description: string;
  earned: boolean;
};

export const getBadges = (stats: {
  workoutCount: number;
  streak: number;
  hasPR: boolean;
  firstWorkoutHour?: number;
}): Badge[] => [
  {
    id: 'streak_7',
    icon: Flame,
    iconColor: '#f97316',
    iconBg: '#fff7ed',
    iconBgDark: '#2d1a0a',
    name: '7 day streak',
    description: 'Work out 7 days in a row',
    earned: stats.streak >= 7,
  },
  {
    id: 'workouts_10',
    icon: Dumbbell,
    iconColor: '#10B981',
    iconBg: '#f0fdf4',
    iconBgDark: '#0d2e22',
    name: '10 workouts',
    description: 'Complete 10 workouts',
    earned: stats.workoutCount >= 10,
  },
  {
    id: 'first_pr',
    icon: Medal,
    iconColor: '#f59e0b',
    iconBg: '#fffbeb',
    iconBgDark: '#2a1a00',
    name: 'First PR',
    description: 'Set your first personal record',
    earned: stats.hasPR,
  },
  {
    id: 'early_bird',
    icon: Sunrise,
    iconColor: '#eab308',
    iconBg: '#fefce8',
    iconBgDark: '#2a2000',
    name: 'Early bird',
    description: 'Complete a workout before 7am',
    earned: stats.firstWorkoutHour !== undefined && stats.firstWorkoutHour < 7,
  },
  {
    id: 'workouts_100',
    icon: Trophy,
    iconColor: '#f59e0b',
    iconBg: '#fffbeb',
    iconBgDark: '#2a1a00',
    name: '100 workouts',
    description: 'Complete 100 workouts',
    earned: stats.workoutCount >= 100,
  },
  {
    id: 'streak_30',
    icon: Gem,
    iconColor: '#3b82f6',
    iconBg: '#eff6ff',
    iconBgDark: '#172034',
    name: '30 day streak',
    description: 'Work out 30 days in a row',
    earned: stats.streak >= 30,
  },
];
