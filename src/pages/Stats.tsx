import { useState } from 'react';
import { Dumbbell, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import {
  screenEnter, staggerContainer, staggerChild, SPRING,
} from '@/animations/fitnex.variants';
import { usePreferences } from '@/context/PreferencesContext';
import { formatWeight } from '@/utils/weight';

// ─── Mock data ────────────────────────────────────────────────────────────────

const weeklyVolume = [
  { day: 'Mon', thisWeek: 0,    lastWeek: 820  },
  { day: 'Tue', thisWeek: 0,    lastWeek: 650  },
  { day: 'Wed', thisWeek: 1480, lastWeek: 1100 },
  { day: 'Thu', thisWeek: 0,    lastWeek: 0    },
  { day: 'Fri', thisWeek: 830,  lastWeek: 700  },
  { day: 'Sat', thisWeek: 0,    lastWeek: 900  },
  { day: 'Sun', thisWeek: 1200, lastWeek: 0    },
];

const muscleGroups = [
  { name: 'Chest',     emoji: '💪', pct: 78 },
  { name: 'Back',      emoji: '🔙', pct: 65 },
  { name: 'Legs',      emoji: '🦵', pct: 50 },
  { name: 'Shoulders', emoji: '🙆', pct: 38 },
];

const personalRecords = [
  { exercise: 'Bench Press', emoji: '🏋️', kg: 82.5, reps: 6, date: 'Wed, 16 Apr', improvement: '+2.5kg' },
  { exercise: 'Deadlift',    emoji: '💀',  kg: 140,  reps: 5, date: 'Wed, 9 Apr',  improvement: '+5kg'   },
  { exercise: 'Squat',       emoji: '🦵',  kg: 120,  reps: 5, date: 'Mon, 14 Apr', improvement: '+2.5kg' },
];

const overviewStats = {
  totalVolume:    9840,
  volumeTrend:    '+12%',
  sessions:       12,
  sessionsTrend:  '+2',
  avgDuration:    47,
  durationTrend:  '-5m',
  streak:         12,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERIOD_PILLS = ['Week', 'Month', '3 Months', 'All time'];

function barColor(pct: number) {
  if (pct >= 70) return '#10B981';
  if (pct >= 50) return '#6ee7b7';
  if (pct >= 30) return '#a7f3d0';
  return '#d1fae5';
}

function TrendBadge({ value }: { value: string }) {
  const negative = value.startsWith('-');
  return (
    <span
      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
        negative ? 'bg-red-50 text-red-500' : 'bg-[#d1fae5] text-tint'
      }`}
    >
      {value}
    </span>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, weightUnit }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  weightUnit: 'kg' | 'lbs';
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#1a1a1a] rounded-xl px-3 py-2 shadow-lg text-[12px]">
      <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name === 'thisWeek' ? 'This week' : 'Last week'}: {p.value > 0 ? formatWeight(p.value, weightUnit) : '—'}
        </p>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Stats() {
  const [activePeriod, setActivePeriod] = useState('Week');
  const { weightUnit } = usePreferences();

  return (
    <motion.div
      className="flex flex-col min-h-screen"
      variants={screenEnter}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >

      {/* ── 1. Header ─────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-[#1a1a1a] px-5 pt-12 pb-0">
        <h1 className="text-[28px] font-black leading-tight tracking-tight mb-4 dark:text-white">Stats</h1>

        {/* Period pills */}
        <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          {PERIOD_PILLS.map((p) => (
            <motion.button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
                activePeriod === p
                  ? 'bg-tint text-white border-tint'
                  : 'bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-[#555] border-gray-200 dark:border-[#333]'
              }`}
              whileTap={{ scale: 0.96 }}
            >
              {p}
            </motion.button>
          ))}
        </div>
      </header>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div className="flex-1 pb-[90px]">

        {/* ── 2. Overview Cards ─────────────────────────────────────────────── */}
        <motion.div
          className="px-4 pt-4 grid grid-cols-2 gap-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >

          {/* Total volume */}
          <motion.div variants={staggerChild} className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-xl bg-tint-muted flex items-center justify-center">
                <Dumbbell size={15} className="text-tint" />
              </div>
              <TrendBadge value={overviewStats.volumeTrend} />
            </div>
            <p className="text-[24px] font-black leading-none tabular-nums dark:text-white">
              {formatWeight(overviewStats.totalVolume, weightUnit)}
            </p>
            <p className="text-[12px] text-gray-400 font-medium mt-1">Total volume</p>
          </motion.div>

          {/* Workouts */}
          <motion.div variants={staggerChild} className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-xl bg-tint-muted flex items-center justify-center">
                <Calendar size={15} className="text-tint" />
              </div>
              <TrendBadge value={overviewStats.sessionsTrend} />
            </div>
            <p className="text-[24px] font-black leading-none tabular-nums dark:text-white">
              {overviewStats.sessions}
            </p>
            <p className="text-[12px] text-gray-400 font-medium mt-1">Workouts</p>
          </motion.div>

          {/* Avg duration */}
          <motion.div variants={staggerChild} className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-xl bg-tint-muted flex items-center justify-center">
                <Clock size={15} className="text-tint" />
              </div>
              <TrendBadge value={overviewStats.durationTrend} />
            </div>
            <p className="text-[24px] font-black leading-none tabular-nums dark:text-white">
              {overviewStats.avgDuration}
              <span className="text-[14px] font-bold text-gray-400 ml-0.5">m avg</span>
            </p>
            <p className="text-[12px] text-gray-400 font-medium mt-1">Avg duration</p>
          </motion.div>

          {/* Streak */}
          <motion.div variants={staggerChild} className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-lg leading-none">
                🔥
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-500">
                🔥 on fire
              </span>
            </div>
            <p className="text-[24px] font-black leading-none tabular-nums">
              {overviewStats.streak}
              <span className="text-[14px] font-bold text-gray-400 ml-0.5">days</span>
            </p>
            <p className="text-[12px] text-gray-400 font-medium mt-1">Current streak</p>
          </motion.div>
        </motion.div>

        {/* ── 3. Volume Chart ───────────────────────────────────────────────── */}
        <motion.div
          className="px-4 pt-5"
          variants={staggerChild}
          initial="initial"
          animate="animate"
        >
          <p className="text-[16px] font-bold mb-3 dark:text-white">Volume this week</p>
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] pt-4 pb-2 px-2">

            {/* Legend */}
            <div className="flex items-center gap-4 px-3 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-tint" />
                <span className="text-[12px] text-gray-500 font-semibold">This week</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#6ee7b7]" />
                <span className="text-[12px] text-gray-500 font-semibold">Last week</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={weeklyVolume} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="thisWeekGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lastWeekGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6ee7b7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#9ca3af' }}
                  dy={6}
                />

                <Tooltip
                  content={<ChartTooltip weightUnit={weightUnit} />}
                  cursor={{ stroke: '#f0f0f0', strokeWidth: 1 }}
                />

                <Area
                  type="monotone"
                  dataKey="lastWeek"
                  stroke="#6ee7b7"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  fill="url(#lastWeekGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#6ee7b7', strokeWidth: 0 }}
                />

                <Area
                  type="monotone"
                  dataKey="thisWeek"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fill="url(#thisWeekGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── 4. Muscle Groups ──────────────────────────────────────────────── */}
        <motion.div
          className="px-4 pt-5"
          variants={staggerChild}
          initial="initial"
          animate="animate"
        >
          <p className="text-[16px] font-bold mb-3 dark:text-white">Muscle groups</p>
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] px-4 py-3 flex flex-col gap-4">
            {muscleGroups.map((mg, idx) => {
              const color = barColor(mg.pct);
              return (
                <div key={mg.name} className="flex items-center gap-3">
                  <span className="text-xl w-7 shrink-0 text-center">{mg.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{mg.name}</span>
                      <span className="text-[12px] font-bold" style={{ color }}>{mg.pct}%</span>
                    </div>
                    <div className="h-[6px] bg-[#f0f0f0] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${mg.pct}%` }}
                        transition={{ ...SPRING.soft, delay: 0.2 + idx * 0.07 }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── 5. Personal Records ───────────────────────────────────────────── */}
        <motion.div
          className="px-4 pt-5"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <p className="text-[16px] font-bold mb-3 dark:text-white">Personal Records</p>
          <div className="flex flex-col gap-3">
            {personalRecords.map((pr) => (
              <motion.div
                key={pr.exercise}
                variants={staggerChild}
                className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] px-4 py-3.5 flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">
                  🏆
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] leading-snug dark:text-white">{pr.exercise}</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {pr.date} · {pr.reps} reps
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <p className="font-black text-[16px] text-gray-900 dark:text-white tabular-nums">
                    {formatWeight(pr.kg, weightUnit)}
                  </p>
                  <span className="text-[11px] font-bold text-tint bg-tint-muted px-2 py-0.5 rounded-full">
                    {pr.improvement}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
