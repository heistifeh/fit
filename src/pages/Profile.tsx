import { useState } from 'react';
import {
  Pencil, Target, Dumbbell, Clock, Coffee, Bell, User,
  Code2, Power, ChevronRight, Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  screenEnter, staggerContainer, staggerChild, press, overlayFade, sheetSlide,
} from '@/animations/fitnex.variants';
import { useAuthContext } from '@/context/AuthContext';

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
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      whileTap={press.whileTap}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-semibold leading-snug ${danger ? 'text-[#ef4444]' : 'text-gray-900'}`}>
          {label}
        </p>
        {sublabel && (
          <p className="text-[12px] text-gray-400 mt-0.5 leading-snug">{sublabel}</p>
        )}
      </div>

      {rightElement ?? (
        <div className="flex items-center gap-1.5 shrink-0">
          {rightValue && (
            <span className="text-[13px] font-semibold text-gray-400">{rightValue}</span>
          )}
          {!danger && <ChevronRight size={16} className="text-gray-300" />}
        </div>
      )}
    </motion.button>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="shrink-0 relative transition-colors duration-200"
      style={{ width: 36, height: 20, borderRadius: 10, backgroundColor: on ? '#10B981' : '#d1d5db' }}
    >
      <span
        className="absolute top-[2px] bg-white rounded-full shadow-sm transition-transform duration-200"
        style={{ width: 16, height: 16, transform: on ? 'translateX(18px)' : 'translateX(2px)' }}
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

// ─── Confirm sheet ────────────────────────────────────────────────────────────

type ConfirmSheetProps = {
  open: boolean;
  title: string;
  subtitle: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

function ConfirmSheet({
  open, title, subtitle, confirmLabel, cancelLabel, onConfirm, onCancel,
}: ConfirmSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            variants={overlayFade}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onCancel}
          />
          <motion.div
            className="relative bg-white rounded-t-2xl w-full px-5 pb-8"
            style={{ maxWidth: 390, marginLeft: 'auto', marginRight: 'auto' }}
            variants={sheetSlide}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 mb-5">
              <div className="w-9 h-1 bg-gray-200 rounded-full" />
            </div>

            <p className="text-[18px] font-black text-gray-900 mb-1.5">{title}</p>
            <p className="text-[14px] text-gray-400 font-medium leading-relaxed mb-6">{subtitle}</p>

            <div className="flex flex-col gap-3">
              {/* Cancel = teal (prominent) */}
              <motion.button
                onClick={onCancel}
                className="w-full py-[16px] rounded-2xl font-black text-white text-[16px]"
                style={{ backgroundColor: '#10B981' }}
                whileTap={press.whileTap}
              >
                {cancelLabel}
              </motion.button>

              {/* Confirm = destructive */}
              <motion.button
                onClick={onConfirm}
                className="w-full py-[15px] rounded-2xl font-semibold text-[15px] border border-gray-200 bg-white text-[#ef4444]"
                whileTap={press.whileTap}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
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
  const { mode, setMode, signOut } = useAuthContext();
  const isGuest = mode === 'guest';

  const [darkMode,            setDarkMode]            = useState(false);
  const [reminders,           setReminders]           = useState(true);
  const [showLogoutConfirm,   setShowLogoutConfirm]   = useState(false);
  const [showExitGuestConfirm, setShowExitGuestConfirm] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('nudgeDismissed');
    localStorage.removeItem('fitnex_token');
    signOut();
  };

  const handleExitGuest = () => {
    localStorage.removeItem('nudgeDismissed');
    signOut();
  };

  return (
    <>
      <motion.div
        className="flex flex-col min-h-screen"
        variants={screenEnter}
        initial="initial"
        animate="animate"
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
      >

        {/* ── 1. Hero Header ──────────────────────────────────────────────── */}
        <header className="bg-white border-b border-gray-100 px-5 pt-12 pb-6">
          {isGuest ? (
            /* Guest state header */
            <div className="flex flex-col items-center">
              {/* Gray avatar with user icon */}
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <User size={32} className="text-gray-400" />
              </div>
              <h1 className="text-[20px] font-black leading-tight">Guest user</h1>
              <p className="text-[13px] text-gray-400 mt-0.5 mb-5">Your progress isn't being saved</p>

              {/* CTA buttons */}
              <motion.button
                onClick={() => setMode('signup')}
                className="w-full py-[15px] rounded-2xl font-black text-white text-[15px] mb-2"
                style={{ backgroundColor: '#10B981' }}
                whileTap={press.whileTap}
              >
                Create free account
              </motion.button>
              <button
                onClick={() => setMode('signin')}
                className="text-[13px] text-gray-400 font-medium"
              >
                Sign in instead
              </button>
            </div>
          ) : (
            /* Authenticated state header */
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                >
                  <span className="text-white font-black" style={{ fontSize: 30 }}>T</span>
                </div>
                <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-tint border-2 border-white flex items-center justify-center shadow-sm active:opacity-80">
                  <Pencil size={10} className="text-white" strokeWidth={2.5} />
                </button>
              </div>
              <h1 className="text-[20px] font-black leading-tight">Tife</h1>
              <p className="text-[13px] text-gray-400 mt-0.5">Member since January 2025</p>

              {/* Stats row */}
              <div className="flex items-center mt-5 w-full">
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
            </div>
          )}
        </header>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <motion.div
          className="flex-1 px-4 pt-5 pb-[90px] flex flex-col gap-5"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >

          {isGuest ? (
            /* ── Guest: locked state card (replaces Badges + Goals) ──────── */
            <motion.div variants={staggerChild}>
              <motion.button
                onClick={() => setMode('signup')}
                className="w-full bg-white rounded-2xl border border-[#f0f0f0] px-4 py-5 flex items-center gap-3 text-left"
                whileTap={press.whileTap}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-bold text-[14px] text-gray-800 leading-snug">
                    Create an account to unlock
                  </p>
                  <p className="text-[12px] text-gray-400 mt-0.5 leading-snug">
                    badges, goals and full stats
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 ml-auto shrink-0" />
              </motion.button>
            </motion.div>
          ) : (
            <>
              {/* ── 2. Badges ─────────────────────────────────────────────── */}
              <motion.div variants={staggerChild}>
                <p className="text-[16px] font-bold mb-3">Badges</p>
                <motion.div
                  className="flex gap-2.5 overflow-x-auto"
                  style={{ scrollbarWidth: 'none' } as React.CSSProperties}
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {BADGES.map((badge) => (
                    <motion.div
                      key={badge.name}
                      variants={staggerChild}
                      className="shrink-0 w-20 bg-white rounded-2xl border border-[#f0f0f0] py-3 flex flex-col items-center gap-1.5"
                      style={{ opacity: badge.locked ? 0.4 : 1 }}
                    >
                      <span className="text-2xl leading-none">{badge.emoji}</span>
                      <span className="text-[10px] text-gray-500 font-medium text-center leading-snug px-1">
                        {badge.name}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* ── 3. Goals ──────────────────────────────────────────────── */}
              <motion.div variants={staggerChild}>
                <SectionLabel>Goals</SectionLabel>
                <motion.div
                  className="bg-white rounded-2xl border border-[#f0f0f0] overflow-hidden"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  <motion.div variants={staggerChild}>
                    <SettingsRow
                      iconBg="#d1fae5"
                      icon={<Target size={16} className="text-tint" />}
                      label="Weekly workout goal"
                      sublabel="How many sessions per week"
                      rightValue="5 days"
                    />
                  </motion.div>
                  <Divider />
                  <motion.div variants={staggerChild}>
                    <SettingsRow
                      iconBg="#fef3c7"
                      icon={<Dumbbell size={16} className="text-amber-500" />}
                      label="Volume goal"
                      sublabel="Target kg lifted per week"
                      rightValue="10,000 kg"
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            </>
          )}

          {/* ── Preferences (shown for all users) ─────────────────────────── */}
          <motion.div variants={staggerChild}>
            <SectionLabel>Preferences</SectionLabel>
            <motion.div
              className="bg-white rounded-2xl border border-[#f0f0f0] overflow-hidden"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={staggerChild}>
                <SettingsRow
                  iconBg="#dbeafe"
                  icon={<Dumbbell size={16} className="text-blue-500" />}
                  label="Weight unit"
                  rightValue="kg"
                />
              </motion.div>
              <Divider />
              <motion.div variants={staggerChild}>
                <SettingsRow
                  iconBg="#d1fae5"
                  icon={<Clock size={16} className="text-tint" />}
                  label="Default rest timer"
                  rightValue="90s"
                />
              </motion.div>
              <Divider />
              <motion.div variants={staggerChild}>
                <SettingsRow
                  iconBg="#ede9fe"
                  icon={<Coffee size={16} className="text-purple-500" />}
                  label="Dark mode"
                  rightElement={<Toggle on={darkMode} onToggle={() => setDarkMode((v) => !v)} />}
                />
              </motion.div>
              <Divider />
              <motion.div variants={staggerChild}>
                <SettingsRow
                  iconBg="#fef3c7"
                  icon={<Bell size={16} className="text-amber-500" />}
                  label="Workout reminders"
                  rightElement={<Toggle on={reminders} onToggle={() => setReminders((v) => !v)} />}
                />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* ── Account ──────────────────────────────────────────────────────── */}
          <motion.div variants={staggerChild}>
            <SectionLabel>Account</SectionLabel>
            <motion.div
              className="bg-white rounded-2xl border border-[#f0f0f0] overflow-hidden"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {!isGuest && (
                <>
                  <motion.div variants={staggerChild}>
                    <SettingsRow
                      iconBg="#dbeafe"
                      icon={<User size={16} className="text-blue-500" />}
                      label="Edit profile"
                    />
                  </motion.div>
                  <Divider />
                  <motion.div variants={staggerChild}>
                    <SettingsRow
                      iconBg="#d1fae5"
                      icon={<Code2 size={16} className="text-tint" />}
                      label="Export data"
                      sublabel="Download your workout history"
                    />
                  </motion.div>
                  <Divider />
                </>
              )}

              {/* Log out (authenticated) / Exit guest mode (guest) */}
              <motion.div variants={staggerChild}>
                <SettingsRow
                  iconBg="#fee2e2"
                  icon={<Power size={16} className="text-red-500" />}
                  label={isGuest ? 'Exit guest mode' : 'Log out'}
                  danger
                  onClick={isGuest
                    ? () => setShowExitGuestConfirm(true)
                    : () => setShowLogoutConfirm(true)
                  }
                />
              </motion.div>
            </motion.div>
          </motion.div>

        </motion.div>
      </motion.div>

      {/* ── Logout confirm sheet ─────────────────────────────────────────────── */}
      <ConfirmSheet
        open={showLogoutConfirm}
        title="Log out?"
        subtitle="You'll need to sign in again to access your workouts."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        onConfirm={() => { setShowLogoutConfirm(false); handleLogout(); }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* ── Exit guest confirm sheet ─────────────────────────────────────────── */}
      <ConfirmSheet
        open={showExitGuestConfirm}
        title="Exit guest mode?"
        subtitle="All your workout data will be lost."
        confirmLabel="Exit"
        cancelLabel="Stay"
        onConfirm={() => { setShowExitGuestConfirm(false); handleExitGuest(); }}
        onCancel={() => setShowExitGuestConfirm(false)}
      />
    </>
  );
}
