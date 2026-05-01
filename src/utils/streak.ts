export const calculateStreak = (isoDates: string[]): number => {
  if (!isoDates.length) return 0;

  const dates = [...new Set(
    isoDates.map(d => new Date(d).toDateString()),
  )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (const dateStr of dates) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.round((current.getTime() - date.getTime()) / 86400000);

    if (diffDays <= 1) {
      streak++;
      current = date;
    } else {
      break;
    }
  }

  return streak;
};
