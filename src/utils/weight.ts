export type WeightUnit = 'kg' | 'lbs';

/** Full display string: "82.5 kg" or "181.8 lbs" */
export const formatWeight = (kg: number, unit: WeightUnit): string => {
  if (unit === 'lbs') return `${(kg * 2.2046).toFixed(1)} lbs`;
  return `${kg} kg`;
};

/** Numeric portion only (for table cells where the column header shows the unit) */
export const fmtWeightNum = (kg: number, unit: WeightUnit): string =>
  unit === 'lbs' ? (kg * 2.2046).toFixed(1) : String(kg);
