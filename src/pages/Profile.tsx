import { useState, useEffect, useRef } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  Target, Dumbbell, Clock, Coffee, Bell, User,
  Code2, Power, ChevronRight, Lock,
} from 'lucide-react';
import dayjs from 'dayjs';
import {
  getWorkouts, getPersonalRecords, uploadAvatar, updateProfile,
  type WorkoutWithExercisesAndSets, type PersonalRecord,
} from '@/lib/supabase';
import { getBadges } from '@/utils/badges';
import useStore from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileScreenSkeleton } from '@/components/Skeleton';
import {
  screenEnter, staggerContainer, staggerChild, press, overlayFade, sheetSlide,
} from '@/animations/fitnex.variants';
import { useAuthContext } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import type { WeightUnit } from '@/utils/weight';

// ─── Rest timer presets ───────────────────────────────────────────────────────

const REST_PRESETS = [
  { label: '30s',  secs: 30  },
  { label: '45s',  secs: 45  },
  { label: '60s',  secs: 60  },
  { label: '90s',  secs: 90  },
  { label: '2m',   secs: 120 },
  { label: '3m',   secs: 180 },
];

const fmtRestSecs = (s: number): string => {
  if (s < 60) return `${s}s`;
  if (s % 60 === 0) return `${s / 60}m`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
};

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
        <p className={`text-[14px] font-semibold leading-snug ${danger ? 'text-[#ef4444]' : 'text-gray-900 dark:text-white'}`}>
          {label}
        </p>
        {sublabel && (
          <p className="text-[12px] text-gray-400 dark:text-[#555] mt-0.5 leading-snug">{sublabel}</p>
        )}
      </div>

      {rightElement ?? (
        <div className="flex items-center gap-1.5 shrink-0">
          {rightValue && (
            <span className="text-[13px] font-semibold text-gray-400 dark:text-[#555]">{rightValue}</span>
          )}
          {!danger && <ChevronRight size={16} className="text-gray-300 dark:text-[#333]" />}
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
    <p className="text-[12px] font-bold text-gray-400 dark:text-[#555] uppercase tracking-[0.06em] mb-2 px-1">
      {children}
    </p>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="mx-4 h-px bg-[#f8f9fa] dark:bg-[#1a1a1a]" />;
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
            className="relative bg-white dark:bg-[#111] rounded-t-2xl w-full px-5 pb-8"
            style={{ maxWidth: 390, marginLeft: 'auto', marginRight: 'auto' }}
            variants={sheetSlide}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="flex justify-center pt-3 mb-5">
              <div className="w-9 h-1 bg-gray-200 dark:bg-[#333] rounded-full" />
            </div>
            <p className="text-[18px] font-black text-gray-900 dark:text-white mb-1.5">{title}</p>
            <p className="text-[14px] text-gray-400 font-medium leading-relaxed mb-6">{subtitle}</p>
            <div className="flex flex-col gap-3">
              <motion.button
                onClick={onCancel}
                className="w-full py-[16px] rounded-2xl font-black text-white text-[16px]"
                style={{ backgroundColor: '#10B981' }}
                whileTap={press.whileTap}
              >
                {cancelLabel}
              </motion.button>
              <motion.button
                onClick={onConfirm}
                className="w-full py-[15px] rounded-2xl font-semibold text-[15px] border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-[#ef4444]"
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

// ─── Sheet wrapper ────────────────────────────────────────────────────────────

function BottomSheet({
  open, onClose, title, children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
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
            onClick={onClose}
          />
          <motion.div
            className="relative bg-white dark:bg-[#111] rounded-t-2xl w-full px-5 pb-10"
            style={{ maxWidth: 390, marginLeft: 'auto', marginRight: 'auto' }}
            variants={sheetSlide}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="flex justify-center pt-3 mb-5">
              <div className="w-9 h-1 bg-gray-200 dark:bg-[#333] rounded-full" />
            </div>
            <p className="text-[18px] font-black text-gray-900 dark:text-white mb-5">{title}</p>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Avatar upload spinner ────────────────────────────────────────────────────

const AVATAR_SPINNER_STYLE = `
  @keyframes av-spin { to { transform: rotate(360deg); } }
  .av-spinner {
    width: 10px; height: 10px;
    border: 1.5px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: av-spin 0.7s linear infinite;
  }
`;

// ─── Main page ────────────────────────────────────────────────────────────────

function computeStreak(isoDates: string[]): number {
  if (!isoDates.length) return 0;
  const workoutDays = new Set(isoDates.map((d) => dayjs(d).format('YYYY-MM-DD')));
  let streak = 0;
  let cursor = dayjs();
  while (workoutDays.has(cursor.format('YYYY-MM-DD'))) {
    streak++;
    cursor = cursor.subtract(1, 'day');
  }
  return streak;
}

export default function Profile() {
  usePageTitle('Profile');
  const { mode, setMode, signOut, profile, user, refreshProfile } = useAuthContext();
  const isGuest = mode === 'guest';
  const displayName = isGuest ? 'Guest Lifter' : (profile?.name || user?.user_metadata?.name || 'You');

  const storeWorkouts = useStore((s) => s.workouts);
  const [dbWorkouts,  setDbWorkouts]  = useState<WorkoutWithExercisesAndSets[]>([]);
  const [dbPRs,       setDbPRs]       = useState<PersonalRecord[]>([]);
  const [loading,     setLoading]     = useState(mode === 'authenticated');
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(profile?.avatar_url ?? null);
  const [uploading,   setUploading]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync avatar from profile once it loads, adding a cache-buster so the
  // browser always fetches the latest image rather than showing a stale cached one.
  useEffect(() => {
    if (profile?.avatar_url) {
      const url = profile.avatar_url;
      setAvatarUrl(url.includes('?') ? url : `${url}?t=${Date.now()}`);
    }
  }, [profile?.avatar_url]);

  // Sync goals from profile
  useEffect(() => {
    if (profile?.weekly_goal != null) setWeeklyGoalState(profile.weekly_goal);
    if (profile?.volume_goal != null) setVolumeGoalState(profile.volume_goal);
  }, [profile?.weekly_goal, profile?.volume_goal]);

  useEffect(() => {
    if (mode !== 'authenticated' || !user?.id) { setLoading(false); return; }
    const minDelay = new Promise<void>((res) => setTimeout(res, 300));
    const dataFetch = Promise.all([getWorkouts(user.id), getPersonalRecords(user.id)]);
    Promise.all([minDelay, dataFetch])
      .then(([, [workouts, prs]]) => { setDbWorkouts(workouts); setDbPRs(prs); })
      .catch((err) => console.error('Profile: failed to load data', err))
      .finally(() => setLoading(false));
  }, [mode, user?.id]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    setUploading(true);
    try {
      const url = await uploadAvatar(user.id, file);
      setAvatarUrl(url);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      showToast('Photo upload failed — try again');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Compute stats
  const workoutCount = mode === 'authenticated'
    ? dbWorkouts.length
    : storeWorkouts.length;

  const totalVolumeKg = mode === 'authenticated'
    ? dbWorkouts.reduce((a, w) => a + (Number(w.total_volume_kg) || 0), 0)
    : storeWorkouts.reduce((a, w) => {
        return a + w.exercises.flatMap((e) => e.sets)
          .filter((s) => (s.reps ?? 0) > 0)
          .reduce((b, s) => b + (s.weight ?? 0) * (s.reps ?? 0), 0);
      }, 0);

  const streak = mode === 'authenticated'
    ? computeStreak(dbWorkouts.map((w) => w.started_at))
    : computeStreak(storeWorkouts.map((w) => w.createdAt.toISOString()));

  // Check if any workout was started before 7am
  const hasEarlyWorkout = mode === 'authenticated'
    ? dbWorkouts.some((w) => new Date(w.started_at).getHours() < 7)
    : storeWorkouts.some((w) => w.createdAt.getHours() < 7);

  const badges = getBadges({
    workoutCount: workoutCount,
    streak:       streak,
    hasPR:        mode === 'authenticated' ? dbPRs.length > 0 : false,
    hasEarlyWorkout,
  });

  const {
    weightUnit, setWeightUnit,
    restTimerSecs, setRestTimerSecs,
    darkMode, setDarkMode,
    reminders, setReminders,
  } = usePreferences();

  const [showLogoutConfirm,    setShowLogoutConfirm]    = useState(false);
  const [showExitGuestConfirm, setShowExitGuestConfirm] = useState(false);
  const [showWeightUnitSheet,  setShowWeightUnitSheet]  = useState(false);
  const [showRestTimerSheet,   setShowRestTimerSheet]   = useState(false);
  const [showEditProfile,      setShowEditProfile]      = useState(false);
  const [showWeeklyGoalSheet,  setShowWeeklyGoalSheet]  = useState(false);
  const [showVolumeGoalSheet,  setShowVolumeGoalSheet]  = useState(false);
  const [customRest,           setCustomRest]           = useState('');
  const [showCustomRest,       setShowCustomRest]       = useState(false);
  const [editName,             setEditName]             = useState('');
  const [editHandle,           setEditHandle]           = useState('');
  const [editSaving,           setEditSaving]           = useState(false);
  const [weeklyGoal,           setWeeklyGoalState]      = useState<number | null>(profile?.weekly_goal ?? null);
  const [volumeGoal,           setVolumeGoalState]      = useState<number | null>(profile?.volume_goal ?? null);
  const [customVolume,         setCustomVolume]         = useState('');
  const [showCustomVolume,     setShowCustomVolume]     = useState(false);
  const [toast,                setToast]                = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('nudgeDismissed');
    localStorage.removeItem('fitnex_token');
    signOut();
  };

  const handleExitGuest = () => {
    localStorage.removeItem('nudgeDismissed');
    signOut();
  };

  const saveToSupabase = async (updates: Parameters<typeof updateProfile>[1]) => {
    if (!user?.id) return;
    try { await updateProfile(user.id, updates); } catch (err) { console.error('Profile update failed:', err); }
  };

  const handleWeightUnit = (unit: WeightUnit) => {
    setWeightUnit(unit);
    setShowWeightUnitSheet(false);
    saveToSupabase({ weight_unit: unit });
  };

  const handleRestPreset = (secs: number) => {
    setRestTimerSecs(secs);
    setShowCustomRest(false);
    setShowRestTimerSheet(false);
    saveToSupabase({ rest_timer_secs: secs });
  };

  const handleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    saveToSupabase({ dark_mode: next });
  };

  const handleRemindersToggle = () => {
    const next = !reminders;
    if (next) {
      Notification.requestPermission().then((permission) => {
        if (permission !== 'granted') {
          showToast('Enable notifications in your browser settings');
          return;
        }
        setReminders(true);
        saveToSupabase({ reminders: true });
      });
    } else {
      setReminders(false);
      saveToSupabase({ reminders: false });
    }
  };

  const handleCustomRest = () => {
    const secs = parseInt(customRest, 10);
    if (!isNaN(secs) && secs > 0) {
      setRestTimerSecs(secs);
      setShowRestTimerSheet(false);
      setShowCustomRest(false);
      setCustomRest('');
      saveToSupabase({ rest_timer_secs: secs });
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setEditSaving(true);
    try {
      const rawHandle = editHandle.trim().replace(/^@+/, '');
      await updateProfile(user.id, {
        name:   editName.trim() || undefined,
        handle: rawHandle ? `@${rawHandle}` : null,
      });
      refreshProfile();
      setShowEditProfile(false);
      showToast('Profile saved');
    } catch (err) {
      console.error('Save profile failed:', err);
      showToast('Failed to save — try again');
    } finally {
      setEditSaving(false);
    }
  };

  const handleWeeklyGoal = async (days: number) => {
    setWeeklyGoalState(days);
    setShowWeeklyGoalSheet(false);
    await saveToSupabase({ weekly_goal: days });
  };

  const handleVolumeGoal = async (kg: number) => {
    setVolumeGoalState(kg);
    setShowVolumeGoalSheet(false);
    setShowCustomVolume(false);
    setCustomVolume('');
    await saveToSupabase({ volume_goal: kg });
  };

  const handleCustomVolume = () => {
    const kg = parseInt(customVolume, 10);
    if (!isNaN(kg) && kg > 0) handleVolumeGoal(kg);
  };

  const handleExportData = async () => {
    if (!user?.id) return;
    try {
      const workouts = await getWorkouts(user.id);
      const blob = new Blob([JSON.stringify(workouts, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitnex-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Export failed — try again');
    }
  };

  const fmtWeeklyGoal = (days: number | null) => days != null ? `${days} day${days !== 1 ? 's' : ''}` : 'Not set';
  const fmtVolumeGoal = (kg: number | null) => kg != null ? `${kg.toLocaleString()} kg` : 'Not set';

  return (
    <>
      <style>{AVATAR_SPINNER_STYLE}</style>
      <motion.div
        className="flex flex-col min-h-screen"
        variants={screenEnter}
        initial="initial"
        animate="animate"
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
      >
        <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ProfileScreenSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >

        {/* ── 1. Hero Header ──────────────────────────────────────────────── */}
        <header className="bg-white dark:bg-[#111] border-b border-gray-100 dark:border-[#1a1a1a] px-5 pt-12 pb-6">
          {isGuest ? (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center mb-3">
                <User size={32} className="text-gray-400" />
              </div>
              <h1 className="text-[20px] font-black leading-tight dark:text-white">Guest user</h1>
              <p className="text-[13px] text-gray-400 mt-0.5 mb-5">Your progress isn't being saved</p>
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
            <div className="flex flex-col items-center">
              <div className="relative mb-3" style={{ width: 80, height: 80 }}>
                {/* Avatar image or initials fallback */}
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    onClick={handleAvatarClick}
                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }}
                  />
                ) : (
                  <div
                    onClick={handleAvatarClick}
                    style={{
                      width: 80, height: 80, borderRadius: '50%', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span className="text-white font-black" style={{ fontSize: 30 }}>
                      {(profile?.name || user?.user_metadata?.name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Edit button overlay */}
                <div
                  onClick={handleAvatarClick}
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 26, height: 26, borderRadius: '50%',
                    background: uploading ? '#9ca3af' : '#10B981',
                    border: '2px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {uploading ? (
                    <div className="av-spinner" />
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  )}
                </div>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
              <h1 className="text-[20px] font-black leading-tight dark:text-white">{displayName}</h1>
              <p className="text-[13px] text-gray-400 mt-0.5">
                {profile?.created_at ? `Member since ${dayjs(profile.created_at).format('MMMM YYYY')}` : 'New member'}
              </p>
              <div className="flex items-center mt-5 w-full">
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[20px] font-black tabular-nums leading-tight dark:text-white">
                    {workoutCount}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">Workouts</span>
                </div>
                <div className="w-px h-8 bg-gray-100 dark:bg-[#1a1a1a]" />
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[20px] font-black tabular-nums leading-tight flex items-center gap-1 dark:text-white">
                    🔥 {streak}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">Streak</span>
                </div>
                <div className="w-px h-8 bg-gray-100 dark:bg-[#1a1a1a]" />
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[20px] font-black tabular-nums leading-tight dark:text-white">
                    {totalVolumeKg >= 1000
                      ? `${(totalVolumeKg / 1000).toFixed(1)}k`
                      : totalVolumeKg.toFixed(0)}
                  </span>
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
            <motion.div variants={staggerChild}>
              <motion.button
                onClick={() => setMode('signup')}
                className="w-full bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] px-4 py-5 flex items-center gap-3 text-left"
                whileTap={press.whileTap}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center shrink-0">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-bold text-[14px] text-gray-800 dark:text-white leading-snug">
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
                <p className="text-[16px] font-bold mb-3 dark:text-white">Badges</p>
                <motion.div
                  className="flex gap-2.5 overflow-x-auto"
                  style={{ scrollbarWidth: 'none' } as React.CSSProperties}
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {badges.map((badge) => (
                    <motion.div
                      key={badge.id}
                      variants={staggerChild}
                      className="shrink-0 w-20 bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] py-3 flex flex-col items-center gap-1.5"
                      style={{
                        opacity: badge.earned ? 1 : 0.35,
                        filter:  badge.earned ? 'none' : 'grayscale(1)',
                      }}
                      title={badge.earned ? badge.description : `🔒 ${badge.description}`}
                    >
                      <span className="text-2xl leading-none">{badge.emoji}</span>
                      <span
                        className="text-[10px] font-medium text-center leading-snug px-1"
                        style={{ color: badge.earned ? '#6b7280' : '#9ca3af' }}
                      >
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
                  className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] overflow-hidden"
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
                      rightValue={fmtWeeklyGoal(weeklyGoal)}
                      onClick={() => setShowWeeklyGoalSheet(true)}
                    />
                  </motion.div>
                  <Divider />
                  <motion.div variants={staggerChild}>
                    <SettingsRow
                      iconBg="#fef3c7"
                      icon={<Dumbbell size={16} className="text-amber-500" />}
                      label="Volume goal"
                      sublabel="Target kg lifted per week"
                      rightValue={fmtVolumeGoal(volumeGoal)}
                      onClick={() => setShowVolumeGoalSheet(true)}
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            </>
          )}

          {/* ── Preferences ───────────────────────────────────────────────── */}
          <motion.div variants={staggerChild}>
            <SectionLabel>Preferences</SectionLabel>
            <motion.div
              className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] overflow-hidden"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={staggerChild}>
                <SettingsRow
                  iconBg="#dbeafe"
                  icon={<Dumbbell size={16} className="text-blue-500" />}
                  label="Weight unit"
                  rightValue={weightUnit}
                  onClick={() => setShowWeightUnitSheet(true)}
                />
              </motion.div>
              <Divider />
              <motion.div variants={staggerChild}>
                <SettingsRow
                  iconBg="#d1fae5"
                  icon={<Clock size={16} className="text-tint" />}
                  label="Default rest timer"
                  rightValue={fmtRestSecs(restTimerSecs)}
                  onClick={() => { setShowCustomRest(false); setShowRestTimerSheet(true); }}
                />
              </motion.div>
              <Divider />
              <motion.div variants={staggerChild}>
                <SettingsRow
                  iconBg="#ede9fe"
                  icon={<Coffee size={16} className="text-purple-500" />}
                  label="Dark mode"
                  rightElement={<Toggle on={darkMode} onToggle={handleDarkMode} />}
                />
              </motion.div>
              <Divider />
              <motion.div variants={staggerChild}>
                <SettingsRow
                  iconBg="#fef3c7"
                  icon={<Bell size={16} className="text-amber-500" />}
                  label="Workout reminders"
                  rightElement={<Toggle on={reminders} onToggle={handleRemindersToggle} />}
                />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* ── Account ───────────────────────────────────────────────────── */}
          <motion.div variants={staggerChild}>
            <SectionLabel>Account</SectionLabel>
            <motion.div
              className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] overflow-hidden"
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
                      onClick={() => {
                        setEditName(profile?.name ?? '');
                        setEditHandle(profile?.handle ?? '');
                        setShowEditProfile(true);
                      }}
                    />
                  </motion.div>
                  <Divider />
                  <motion.div variants={staggerChild}>
                    <SettingsRow
                      iconBg="#d1fae5"
                      icon={<Code2 size={16} className="text-tint" />}
                      label="Export data"
                      sublabel="Download your workout history"
                      onClick={handleExportData}
                    />
                  </motion.div>
                  <Divider />
                </>
              )}
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
        )}
        </AnimatePresence>
      </motion.div>

      {/* ── Weight unit sheet ─────────────────────────────────────────────────── */}
      <BottomSheet
        open={showWeightUnitSheet}
        onClose={() => setShowWeightUnitSheet(false)}
        title="Weight unit"
      >
        <div className="flex flex-col gap-3">
          {(['kg', 'lbs'] as WeightUnit[]).map((unit) => {
            const selected = weightUnit === unit;
            return (
              <motion.button
                key={unit}
                onClick={() => handleWeightUnit(unit)}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl border transition-colors"
                style={{
                  backgroundColor: selected ? '#f0fdf4' : 'transparent',
                  borderColor: selected ? '#10B981' : '#e5e7eb',
                }}
                whileTap={press.whileTap}
              >
                <span className={`text-[15px] font-bold ${selected ? 'text-tint' : 'text-gray-800 dark:text-white'}`}>
                  {unit === 'kg' ? 'Kilograms (kg)' : 'Pounds (lbs)'}
                </span>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: selected ? '#10B981' : '#d1d5db' }}
                >
                  {selected && <div className="w-2.5 h-2.5 rounded-full bg-tint" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </BottomSheet>

      {/* ── Rest timer sheet ──────────────────────────────────────────────────── */}
      <BottomSheet
        open={showRestTimerSheet}
        onClose={() => setShowRestTimerSheet(false)}
        title="Default rest timer"
      >
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {REST_PRESETS.map(({ label, secs }) => {
            const selected = restTimerSecs === secs && !showCustomRest;
            return (
              <motion.button
                key={secs}
                onClick={() => handleRestPreset(secs)}
                className="py-3 rounded-2xl text-[14px] font-bold border transition-colors"
                style={{
                  backgroundColor: selected ? '#10B981' : 'transparent',
                  borderColor: selected ? '#10B981' : '#e5e7eb',
                  color: selected ? '#ffffff' : '#374151',
                }}
                whileTap={press.whileTap}
              >
                {label}
              </motion.button>
            );
          })}
          <motion.button
            onClick={() => setShowCustomRest(true)}
            className="py-3 rounded-2xl text-[14px] font-bold border transition-colors"
            style={{
              backgroundColor: showCustomRest ? '#10B981' : 'transparent',
              borderColor: showCustomRest ? '#10B981' : '#e5e7eb',
              color: showCustomRest ? '#ffffff' : '#374151',
            }}
            whileTap={press.whileTap}
          >
            Custom
          </motion.button>
        </div>

        <AnimatePresence>
          {showCustomRest && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex gap-2"
            >
              <input
                type="number"
                placeholder="Seconds"
                value={customRest}
                onChange={(e) => setCustomRest(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 dark:border-[#333] bg-[#f8f9fa] dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-[15px] font-semibold outline-none focus:border-tint"
                onKeyDown={(e) => e.key === 'Enter' && handleCustomRest()}
                autoFocus
              />
              <motion.button
                onClick={handleCustomRest}
                className="px-5 py-3 rounded-2xl font-bold text-white text-[14px]"
                style={{ backgroundColor: '#10B981' }}
                whileTap={press.whileTap}
              >
                Set
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </BottomSheet>

      {/* ── Edit profile sheet ──────────────────────────────────────────────── */}
      <BottomSheet
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Edit profile"
      >
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[12px] font-bold text-gray-400 dark:text-[#555] uppercase tracking-wide mb-1.5 block">
              Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-[#333] bg-[#f8f9fa] dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-[15px] font-semibold outline-none focus:border-tint"
            />
          </div>
          <div>
            <label className="text-[12px] font-bold text-gray-400 dark:text-[#555] uppercase tracking-wide mb-1.5 block">
              Handle
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-gray-400">
                @
              </span>
              <input
                type="text"
                value={editHandle.replace(/^@+/, '')}
                onChange={(e) => setEditHandle(e.target.value.replace(/^@+/, '').replace(/\s/g, ''))}
                placeholder="yourhandle"
                className="w-full pl-8 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-[#333] bg-[#f8f9fa] dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-[15px] font-semibold outline-none focus:border-tint"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5 px-1">
              This will appear on your shared workout cards on X
            </p>
          </div>
          <motion.button
            onClick={handleSaveProfile}
            disabled={editSaving}
            className="w-full py-[16px] rounded-2xl font-black text-white text-[16px] mt-1"
            style={{ backgroundColor: editSaving ? '#9ca3af' : '#10B981' }}
            whileTap={editSaving ? {} : press.whileTap}
          >
            {editSaving ? 'Saving…' : 'Save'}
          </motion.button>
        </div>
      </BottomSheet>

      {/* ── Weekly goal sheet ────────────────────────────────────────────────── */}
      <BottomSheet
        open={showWeeklyGoalSheet}
        onClose={() => setShowWeeklyGoalSheet(false)}
        title="Weekly workout goal"
      >
        <div className="grid grid-cols-4 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7].map((days) => {
            const selected = weeklyGoal === days;
            return (
              <motion.button
                key={days}
                onClick={() => handleWeeklyGoal(days)}
                className="py-4 rounded-2xl text-[15px] font-black border transition-colors"
                style={{
                  backgroundColor: selected ? '#10B981' : 'transparent',
                  borderColor: selected ? '#10B981' : '#e5e7eb',
                  color: selected ? '#ffffff' : undefined,
                }}
                whileTap={press.whileTap}
              >
                <span className={selected ? 'text-white' : 'text-gray-800 dark:text-white'}>{days}</span>
              </motion.button>
            );
          })}
        </div>
        <p className="text-[12px] text-gray-400 text-center mt-3">days per week</p>
      </BottomSheet>

      {/* ── Volume goal sheet ────────────────────────────────────────────────── */}
      <BottomSheet
        open={showVolumeGoalSheet}
        onClose={() => setShowVolumeGoalSheet(false)}
        title="Weekly volume goal"
      >
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {[5000, 8000, 10000, 15000, 20000].map((kg) => {
            const selected = volumeGoal === kg && !showCustomVolume;
            return (
              <motion.button
                key={kg}
                onClick={() => handleVolumeGoal(kg)}
                className="py-4 rounded-2xl text-[14px] font-bold border transition-colors"
                style={{
                  backgroundColor: selected ? '#10B981' : 'transparent',
                  borderColor: selected ? '#10B981' : '#e5e7eb',
                  color: selected ? '#ffffff' : undefined,
                }}
                whileTap={press.whileTap}
              >
                <span className={selected ? 'text-white' : 'text-gray-800 dark:text-white'}>
                  {kg >= 1000 ? `${kg / 1000}k` : kg} kg
                </span>
              </motion.button>
            );
          })}
          <motion.button
            onClick={() => setShowCustomVolume(true)}
            className="py-4 rounded-2xl text-[14px] font-bold border transition-colors"
            style={{
              backgroundColor: showCustomVolume ? '#10B981' : 'transparent',
              borderColor: showCustomVolume ? '#10B981' : '#e5e7eb',
              color: showCustomVolume ? '#ffffff' : undefined,
            }}
            whileTap={press.whileTap}
          >
            <span className={showCustomVolume ? 'text-white' : 'text-gray-800 dark:text-white'}>Custom</span>
          </motion.button>
        </div>
        <AnimatePresence>
          {showCustomVolume && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex gap-2"
            >
              <input
                type="number"
                placeholder="kg per week"
                value={customVolume}
                onChange={(e) => setCustomVolume(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 dark:border-[#333] bg-[#f8f9fa] dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-[15px] font-semibold outline-none focus:border-tint"
                onKeyDown={(e) => e.key === 'Enter' && handleCustomVolume()}
                autoFocus
              />
              <motion.button
                onClick={handleCustomVolume}
                className="px-5 py-3 rounded-2xl font-bold text-white text-[14px]"
                style={{ backgroundColor: '#10B981' }}
                whileTap={press.whileTap}
              >
                Set
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </BottomSheet>

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

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-[70] bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-semibold px-4 py-2.5 rounded-2xl shadow-lg whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
