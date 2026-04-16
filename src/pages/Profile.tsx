import { useState } from 'react';
import {
  Pencil, Target, Dumbbell, Clock, Coffee, Bell, User,
  Code2, Power, ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsRowProps = {
  iconBg: string;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  rightValue?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
};

// ─── SettingsRow ──────────────────────────────────────────────────────────────

function SettingsRow({
  iconBg, icon, label, sublabel, rightValue, rightElement, onClick, danger,
}: SettingsRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 transition-colors"
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-semibold leading-snug ${danger ? 'text-[#ef4444]' : 'text-gray-900'}`}>
          {label}
        </p>
        {sublabel && (
          <p className="text-[12px] text-gray-400 mt-0.5 leading-snug">{sublabel}</p>
        )}
      </div>

      {/* Right */}
      {rightElement ?? (
        <div className="flex items-center gap-1.5 shrink-0">
          {rightValue && (
            <span className="text-[13px] font-semibold text-gray-400">{rightValue}</span>
          )}
          {!danger && <ChevronRight size={16} className="text-gray-300" />}
        </div>
      )}
    </button>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="shrink-0 relative transition-colors duration-200"
      style={{
        width: 36, height: 20,
        borderRadius: 10,
        backgroundColor: on ? '#10B981' : '#d1d5db',
      }}
    >
      <span
        className="absolute top-[2px] bg-white rounded-full shadow-sm transition-transform duration-200"
        style={{
          width: 16, height: 16,
          transform: on ? 'translateX(18px)' : 'translateX(2px)',
        }}
      />
    </button>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.06em] mb-2 px-1">
      {children}
    </p>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="mx-4 h-px bg-[#f8f9fa]" />;
}

// ─── Badge data ───────────────────────────────────────────────────────────────

const BADGES = [
  { emoji: '🔥', name: '7 day streak',  locked: false },
  { emoji: '💯', name: '100 workouts',  locked: false },
  { emoji: '🏆', name: 'First PR',      locked: false },
  { emoji: '⚡', name: 'Early bird',    locked: false },
  { emoji: '💎', name: '365 streak',    locked: true  },
  { emoji: '🦁', name: '1000 sets',     locked: true  },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Profile() {
  const [darkMode,   setDarkMode]   = useState(false);
  const [reminders,  setReminders]  = useState(true);

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── 1. Hero Header ────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 px-5 pt-12 pb-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative mb-3">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
            >
              <span className="text-white font-black" style={{ fontSize: 30 }}>T</span>
            </div>
            {/* Edit button */}
            <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-tint border-2 border-white flex items-center justify-center shadow-sm active:opacity-80">
              <Pencil size={10} className="text-white" strokeWidth={2.5} />
            </button>
          </div>

          <h1 className="text-[20px] font-black leading-tight">Tife</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Member since January 2025</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center mt-5">
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[20px] font-black tabular-nums leading-tight">148</span>
            <span className="text-[11px] text-gray-400 font-medium">Workouts</span>
          </div>

          <div className="w-px h-8 bg-gray-100" />

          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[20px] font-black tabular-nums leading-tight flex items-center gap-1">
              🔥 12
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Streak</span>
          </div>

          <div className="w-px h-8 bg-gray-100" />

          <div className="flex-1 flex flex-col items-center gap-0.5">
            <span className="text-[20px] font-black tabular-nums leading-tight">42,600</span>
            <span className="text-[11px] text-gray-400 font-medium">kg lifted</span>
          </div>
        </div>
      </header>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-5 pb-[90px] flex flex-col gap-5">

        {/* ── 2. Badges ─────────────────────────────────────────────────────── */}
        <div>
          <p className="text-[16px] font-bold mb-3">Badges</p>
          <div
            className="flex gap-2.5 overflow-x-auto"
            style={{ scrollbarWidth: 'none' } as React.CSSProperties}
          >
            {BADGES.map((badge) => (
              <div
                key={badge.name}
                className="shrink-0 w-20 bg-white rounded-2xl border border-[#f0f0f0] py-3 flex flex-col items-center gap-1.5"
                style={{ opacity: badge.locked ? 0.4 : 1 }}
              >
                <span className="text-2xl leading-none">{badge.emoji}</span>
                <span className="text-[10px] text-gray-500 font-medium text-center leading-snug px-1">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. Goals ──────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Goals</SectionLabel>
          <div className="bg-white rounded-2xl border border-[#f0f0f0] overflow-hidden">
            <SettingsRow
              iconBg="#d1fae5"
              icon={<Target size={16} className="text-tint" />}
              label="Weekly workout goal"
              sublabel="How many sessions per week"
              rightValue="5 days"
            />
            <Divider />
            <SettingsRow
              iconBg="#fef3c7"
              icon={<Dumbbell size={16} className="text-amber-500" />}
              label="Volume goal"
              sublabel="Target kg lifted per week"
              rightValue="10,000 kg"
            />
          </div>
        </div>

        {/* ── 4. Preferences ────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Preferences</SectionLabel>
          <div className="bg-white rounded-2xl border border-[#f0f0f0] overflow-hidden">
            <SettingsRow
              iconBg="#dbeafe"
              icon={<Dumbbell size={16} className="text-blue-500" />}
              label="Weight unit"
              rightValue="kg"
            />
            <Divider />
            <SettingsRow
              iconBg="#d1fae5"
              icon={<Clock size={16} className="text-tint" />}
              label="Default rest timer"
              rightValue="90s"
            />
            <Divider />
            <SettingsRow
              iconBg="#ede9fe"
              icon={<Coffee size={16} className="text-purple-500" />}
              label="Dark mode"
              rightElement={
                <Toggle on={darkMode} onToggle={() => setDarkMode((v) => !v)} />
              }
            />
            <Divider />
            <SettingsRow
              iconBg="#fef3c7"
              icon={<Bell size={16} className="text-amber-500" />}
              label="Workout reminders"
              rightElement={
                <Toggle on={reminders} onToggle={() => setReminders((v) => !v)} />
              }
            />
          </div>
        </div>

        {/* ── 5. Account ────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Account</SectionLabel>
          <div className="bg-white rounded-2xl border border-[#f0f0f0] overflow-hidden">
            <SettingsRow
              iconBg="#dbeafe"
              icon={<User size={16} className="text-blue-500" />}
              label="Edit profile"
            />
            <Divider />
            <SettingsRow
              iconBg="#d1fae5"
              icon={<Code2 size={16} className="text-tint" />}
              label="Export data"
              sublabel="Download your workout history"
            />
            <Divider />
            <SettingsRow
              iconBg="#fee2e2"
              icon={<Power size={16} className="text-red-500" />}
              label="Log out"
              danger
            />
          </div>
        </div>

      </div>
    </div>
  );
}
