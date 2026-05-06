import React from 'react';
import { getMuscleColor } from '@/utils/exerciseIcon';

interface ExerciseIconProps {
  muscleGroup: string;
  size?: number;
  borderRadius?: number;
  darkMode?: boolean;
}

const ExerciseIcon = ({
  muscleGroup,
  size = 38,
  borderRadius = 10,
  darkMode = false,
}: ExerciseIconProps) => {
  const { bg, stroke } = getMuscleColor(muscleGroup, darkMode);

  const iconKey = (() => {
    const g = muscleGroup?.toLowerCase() ?? '';
    if (g.includes('chest')) return 'chest';
    if (g.includes('back') || g.includes('trap')) return 'back';
    if (g.includes('leg') || g.includes('quad') || g.includes('glute') || g.includes('hamstring') || g.includes('calf') || g.includes('calve')) return 'legs';
    if (g.includes('shoulder') || g.includes('delt')) return 'shoulders';
    if (g.includes('bicep') || g.includes('tricep') || g.includes('arm')) return 'arms';
    if (g.includes('core')) return 'core';
    if (g.includes('full') || g.includes('cardio')) return 'fullbody';
    return 'default';
  })();

  const svgSize = Math.round(size * 0.47);

  const icons: Record<string, React.ReactElement> = {
    chest: (
      <svg width={svgSize} height={svgSize} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    back: (
      <svg width={svgSize} height={svgSize} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    legs: (
      <svg width={svgSize} height={svgSize} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
        <path d="M8 3v18M16 3v18"/>
        <path d="M5 9h14M5 15h14"/>
      </svg>
    ),
    shoulders: (
      <svg width={svgSize} height={svgSize} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="5" r="3"/>
        <path d="M12 8v6"/>
        <path d="M8 18l4-4 4 4"/>
      </svg>
    ),
    arms: (
      <svg width={svgSize} height={svgSize} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
        <path d="M6 4v6a6 6 0 0 0 12 0V4"/>
        <line x1="6" y1="4" x2="18" y2="4"/>
      </svg>
    ),
    core: (
      <svg width={svgSize} height={svgSize} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v8M8 12h8"/>
      </svg>
    ),
    fullbody: (
      <svg width={svgSize} height={svgSize} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    default: (
      <svg width={svgSize} height={svgSize} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icons[iconKey]}
    </div>
  );
};

export default ExerciseIcon;
