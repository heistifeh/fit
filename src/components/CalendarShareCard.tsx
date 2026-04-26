import { useRef, useState, useEffect } from 'react';
import { X, Download, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDaysInMonth, startOfMonth, getDay, format } from 'date-fns';
import html2canvas from 'html2canvas';
import { overlayFade, sheetSlide, press } from '@/animations/fitnex.variants';
import { useAuthContext } from '@/context/AuthContext';
import { updateProfile } from '@/lib/supabase';
import { usePreferences } from '@/context/PreferencesContext';
import type { WorkoutWithExercisesAndSets } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarShareCardProps = {
  onClose: () => void;
  workouts: WorkoutWithExercisesAndSets[];
  streak: number;
};

type BackgroundType = 'dark' | 'gradient' | 'teal-dark' | 'photo';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPercentile(volume: number): number {
  if (volume >= 1500) return 3;
  if (volume >= 1000) return 8;
  if (volume >= 700)  return 15;
  if (volume >= 400)  return 35;
  return 60;
}

function getCardBg(bgType: BackgroundType, bgPhotoUrl: string | null): React.CSSProperties {
  switch (bgType) {
    case 'gradient':
      return { background: 'linear-gradient(160deg, #0a0a0a 0%, #0a0a0a 40%, #064e3b 75%, #0d9e6e 100%)' };
    case 'teal-dark':
      return { background: '#042f23' };
    case 'photo':
      return bgPhotoUrl ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.7)), url(${bgPhotoUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : { background: '#080808' };
    default:
      return { background: '#080808' };
  }
}

function XLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function BgOption({
  selected, onClick, style, children,
}: {
  selected: boolean;
  onClick: () => void;
  style: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={press.whileTap}
      style={{
        width: 56, height: 56,
        borderRadius: 12,
        border: selected ? '2.5px solid #10B981' : '2px solid #333',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 0.2s',
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

const SPINNER_STYLES = `
  @keyframes cal-spin { to { transform: rotate(360deg); } }
  .cal-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: cal-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
`;

// ─── Instruction step ─────────────────────────────────────────────────────────

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-tint flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-white text-[11px] font-black">{n}</span>
      </div>
      <p className="text-[14px] text-gray-700 dark:text-[#aaa] font-medium leading-snug pt-0.5">{text}</p>
    </div>
  );
}

// ─── Exportable calendar card ─────────────────────────────────────────────────

type CalendarCardInternalProps = {
  cardRef: React.RefObject<HTMLDivElement | null>;
  cardBgStyle: React.CSSProperties;
  avatarUrl: string | null;
  displayName: string;
  handle: string;
  workouts: WorkoutWithExercisesAndSets[];
  streak: number;
};

function CalendarCard({
  cardRef, cardBgStyle, avatarUrl, displayName, handle, workouts, streak,
}: CalendarCardInternalProps) {
  const today = new Date();
  const monthName = format(today, 'MMMM yyyy');
  const daysInMonth = getDaysInMonth(today);
  const firstDayOfMonth = getDay(startOfMonth(today)); // 0=Sun
  const todayDate = today.getDate();

  // Days that have at least one finished workout this month
  const workoutDays = new Set(
    workouts
      .filter((w) => {
        const d = new Date(w.started_at);
        return (
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear() &&
          w.finished_at !== null
        );
      })
      .map((w) => new Date(w.started_at).getDate()),
  );

  const finishedWorkouts = workouts.filter((w) => w.finished_at !== null);
  const totalSessions = finishedWorkouts.length;
  const totalVolume = workouts.reduce((sum, w) => sum + (Number(w.total_volume_kg) || 0), 0);
  const weeklyVolume = (() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return workouts
      .filter((w) => new Date(w.started_at) >= weekAgo && w.finished_at !== null)
      .reduce((sum, w) => sum + (Number(w.total_volume_kg) || 0), 0);
  })();
  const weeklyRankPct = getPercentile(weeklyVolume);

  const formatVolume = (kg: number) => {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
    return String(Math.round(kg));
  };

  const byLine = handle && handle.trim()
    ? (handle.startsWith('@') ? handle : `@${handle}`)
    : displayName;

  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Build flat cell array: empty cells + day cells
  const cells: Array<{ type: 'empty' } | { type: 'day'; day: number }> = [
    ...Array.from({ length: firstDayOfMonth }, () => ({ type: 'empty' as const })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({ type: 'day' as const, day: i + 1 })),
  ];

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div
      ref={cardRef}
      style={{
        ...cardBgStyle,
        borderRadius: 22,
        overflow: 'hidden',
        maxWidth: 400,
        width: '100%',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        transition: 'background 0.3s ease',
      }}
    >
      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0 }} />
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, letterSpacing: '0.14em' }}>FITNEX</span>
        </div>
        <span style={{ color: '#ffffff88', fontSize: 12, fontWeight: 500 }}>{monthName}</span>
      </div>

      {/* ── Avatar + name ───────────────────────────────────────────────── */}
      <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, border: '2px solid #1a1a1a', overflow: 'hidden' }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>{initial}</span>
            </div>
          )}
        </div>
        <div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0, lineHeight: 1.2 }}>{displayName}</p>
          <p style={{ color: '#ffffff55', fontWeight: 500, fontSize: 12, margin: '3px 0 0' }}>Consistency is the goal</p>
        </div>
      </div>

      {/* ── Streak hero ─────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 24px 0', display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>🔥</span>
        <span style={{ color: '#fff', fontSize: 52, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1 }}>
          {streak}
        </span>
        <span style={{ color: '#ffffff55', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>day streak</span>
      </div>

      {/* ── Calendar grid ───────────────────────────────────────────────── */}
      <div style={{ padding: '16px 24px 20px' }}>
        {/* Day labels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {DAY_LABELS.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#ffffff33', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((cell, i) => {
            if (cell.type === 'empty') {
              return <div key={`e-${i}`} />;
            }
            const { day } = cell;
            const hasWorkout = workoutDays.has(day);
            const isToday = day === todayDate;
            const isFuture = day > todayDate;

            return (
              <div
                key={day}
                style={{
                  aspectRatio: '1',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: hasWorkout || isToday ? '#10B981' : '#111',
                  opacity: isFuture && !hasWorkout ? 0.3 : 1,
                  boxShadow: isToday ? '0 0 0 2px #080808, 0 0 0 3.5px #10B981' : 'none',
                  position: 'relative',
                }}
              >
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: hasWorkout || isToday ? '#fff' : '#ffffff55',
                  lineHeight: 1,
                }}>
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #111', display: 'flex' }}>
        {[
          { value: String(totalSessions),        label: 'Sessions'   },
          { value: `${formatVolume(totalVolume)}kg`, label: 'Total lifted' },
          { value: `Top ${weeklyRankPct}%`,       label: 'This week'  },
        ].map((stat, i, arr) => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              padding: '14px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              borderRight: i < arr.length - 1 ? '1px solid #111' : 'none',
            }}
          >
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1 }}>
              {stat.value}
            </span>
            <span style={{ color: '#ffffff55', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 24px 18px', borderTop: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: '#ffffff88', fontSize: 12, fontWeight: 500, margin: 0 }}>
          by <span style={{ color: '#10B981', fontWeight: 700 }}>{byLine}</span>
        </p>
        <div style={{ backgroundColor: '#10B981', borderRadius: 999, padding: '5px 12px' }}>
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>Join Fitnex</span>
        </div>
        <p style={{ color: '#ffffff33', fontSize: 12, fontWeight: 600, margin: 0 }}>fitnexonline.com</p>
      </div>
    </div>
  );
}

// ─── Main overlay component ───────────────────────────────────────────────────

export default function CalendarShareCard({ onClose, workouts, streak }: CalendarShareCardProps) {
  const { user, profile, refreshProfile } = useAuthContext();
  const { darkMode } = usePreferences();

  const cardRef      = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bgType,           setBgType]           = useState<BackgroundType>('dark');
  const [bgPhotoUrl,       setBgPhotoUrl]        = useState<string | null>(null);
  const [isGenerating,     setIsGenerating]      = useState(false);
  const [isSaving,         setIsSaving]          = useState(false);
  const [exportError,      setExportError]       = useState('');
  const [showInstructions, setShowInstructions]  = useState(false);

  // Handle nudge
  const [displayHandle,    setDisplayHandle]     = useState(profile?.handle ?? '');
  const [showHandlePrompt, setShowHandlePrompt]  = useState(false);
  const [handleInput,      setHandleInput]       = useState('');
  const [savingHandle,     setSavingHandle]      = useState(false);
  const [handleToast,      setHandleToast]       = useState(false);

  useEffect(() => { setDisplayHandle(profile?.handle ?? ''); }, [profile?.handle]);

  // Revoke photo object URL on unmount
  useEffect(() => {
    return () => { if (bgPhotoUrl) URL.revokeObjectURL(bgPhotoUrl); };
  }, [bgPhotoUrl]);

  const displayName = profile?.name || user?.user_metadata?.name || 'Lifter';
  const avatarUrl   = profile?.avatar_url ?? null;
  const cardBgStyle = getCardBg(bgType, bgPhotoUrl);

  const showExportError = (msg: string) => {
    setExportError(msg);
    setTimeout(() => setExportError(''), 3500);
  };

  const generateCanvas = async () => {
    if (!cardRef.current) throw new Error('No card ref');
    return html2canvas(cardRef.current, {
      scale: 3,
      backgroundColor: '#080808',
      useCORS: bgType !== 'photo',
      allowTaint: bgType === 'photo',
      imageTimeout: 8000,
      logging: false,
    });
  };

  // Compute stats for caption
  const workoutDaysCount = new Set(
    workouts
      .filter((w) => {
        const d = new Date(w.started_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && w.finished_at !== null;
      })
      .map((w) => new Date(w.started_at).getDate()),
  ).size;

  const weeklyVolume = (() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return workouts
      .filter((w) => new Date(w.started_at) >= weekAgo && w.finished_at !== null)
      .reduce((sum, w) => sum + (Number(w.total_volume_kg) || 0), 0);
  })();
  const weeklyRankPct = getPercentile(weeklyVolume);

  const buildCaption = () => [
    `${streak} day streak and counting 🔥`,
    `${workoutDaysCount} workout${workoutDaysCount !== 1 ? 's' : ''} this month on fitnex`,
    `top ${weeklyRankPct}% volume this week 📈`,
    ``,
    `#Fitnex #GymLife #Consistency`,
  ].join('\n');

  const handleShareX = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const canvas = await generateCanvas();
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'fitnex-streak.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'My Fitnex Streak',
              text: buildCaption(),
            });
            return;
          } catch {
            // User cancelled share — fall through to download
          }
        }

        // Fallback: download + show instructions
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'fitnex-streak.png';
        link.click();
        URL.revokeObjectURL(url);
        setShowInstructions(true);
      }, 'image/png');
    } catch {
      showExportError('Export failed. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const canvas = await generateCanvas();
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `fitnex-streak-${format(new Date(), 'yyyy-MM')}.png`;
      link.click();
    } catch {
      showExportError('Could not save image. Try a different background.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenX = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildCaption())}`,
      '_blank',
    );
    setShowInstructions(false);
  };

  const handleSaveHandle = async () => {
    const trimmed = handleInput.trim().replace(/^@+/, '');
    if (!trimmed || !user?.id) return;
    setSavingHandle(true);
    try {
      const newHandle = `@${trimmed}`;
      await updateProfile(user.id, { handle: newHandle });
      setDisplayHandle(newHandle);
      setShowHandlePrompt(false);
      setHandleInput('');
      setHandleToast(true);
      setTimeout(() => setHandleToast(false), 3000);
      refreshProfile();
    } catch {
      // silent — handle toast will not appear
    } finally {
      setSavingHandle(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bgPhotoUrl) URL.revokeObjectURL(bgPhotoUrl);
    setBgPhotoUrl(URL.createObjectURL(file));
    setBgType('photo');
    e.target.value = '';
  };

  const handlePhotoTileClick = () => {
    if (!bgPhotoUrl || bgType !== 'photo') {
      if (!bgPhotoUrl) fileInputRef.current?.click();
      else setBgType('photo');
    } else {
      fileInputRef.current?.click();
    }
  };

  const removePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bgPhotoUrl) URL.revokeObjectURL(bgPhotoUrl);
    setBgPhotoUrl(null);
    setBgType('dark');
  };

  const sheetBg  = darkMode ? '#0a0a0a' : '#f8f9fa';
  const borderColor = darkMode ? '#1a1a1a' : '#f0f0f0';

  return (
    <>
      <style>{SPINNER_STYLES}</style>

      {/* Dark overlay */}
      <motion.div
        variants={overlayFade}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200 }}
      />

      {/* Sheet */}
      <motion.div
        variants={sheetSlide}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 201,
          background: sheetBg,
          borderRadius: '20px 20px 0 0',
          maxHeight: '94dvh',
          overflowY: 'auto',
        }}
      >
        {/* Close row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 4px' }}>
          <p style={{ fontSize: 16, fontWeight: 900, color: darkMode ? '#fff' : '#111', margin: 0 }}>Share streak</p>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: darkMode ? '#1a1a1a' : '#f3f4f6',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={16} color="#6b7280" />
          </button>
        </div>

        {/* Card preview */}
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'center' }}>
          <CalendarCard
            cardRef={cardRef}
            cardBgStyle={cardBgStyle}
            avatarUrl={avatarUrl}
            displayName={displayName}
            handle={displayHandle}
            workouts={workouts}
            streak={streak}
          />
        </div>

        {/* Handle nudge */}
        {!displayHandle && (
          <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'center' }}>
            <motion.button
              onClick={() => { setHandleInput(''); setShowHandlePrompt(true); }}
              whileTap={press.whileTap}
              style={{
                width: '100%', maxWidth: 400,
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#141414', borderRadius: 14, border: '1px solid #2a2a2a',
                padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>Add your X handle</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.3 }}>Shows on your shared cards</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </motion.button>
          </div>
        )}

        {/* Background picker */}
        <div style={{ padding: '4px 16px 16px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Background
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <BgOption selected={bgType === 'dark'} onClick={() => setBgType('dark')} style={{ backgroundColor: '#080808' }} />
            <BgOption selected={bgType === 'gradient'} onClick={() => setBgType('gradient')} style={{ background: 'linear-gradient(160deg, #0a0a0a 60%, #0d9e6e 100%)' }} />
            <BgOption selected={bgType === 'teal-dark'} onClick={() => setBgType('teal-dark')} style={{ backgroundColor: '#042f23' }} />
            <BgOption
              selected={bgType === 'photo'}
              onClick={handlePhotoTileClick}
              style={bgPhotoUrl ? {
                backgroundImage: `url(${bgPhotoUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : { backgroundColor: '#1a1a1a' }}
            >
              {!bgPhotoUrl && <Camera size={20} color="#555" />}
              {bgPhotoUrl && (
                <button
                  onClick={removePhoto}
                  style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={9} color="white" />
                </button>
              )}
            </BgOption>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        </div>

        {/* Action buttons */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <motion.button
            onClick={handleShareX}
            disabled={isGenerating}
            whileTap={press.whileTap}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '16px 0', borderRadius: 14, border: '1px solid #333',
              background: '#000', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer',
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            {isGenerating ? (
              <><span className="cal-spinner" />Saving card...</>
            ) : (
              <><XLogo size={17} />Share on X</>
            )}
          </motion.button>

          <motion.button
            onClick={handleSave}
            disabled={isSaving || isGenerating}
            whileTap={press.whileTap}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '16px 0', borderRadius: 14, border: `1px solid ${borderColor}`,
              background: darkMode ? '#111' : '#fff', color: '#888', fontWeight: 600, fontSize: 15, cursor: 'pointer',
              opacity: (isSaving || isGenerating) ? 0.5 : 1,
            }}
          >
            <Download size={16} />
            {isSaving ? 'Saving…' : 'Save as image'}
          </motion.button>
        </div>

        {/* Caption preview */}
        <div style={{ padding: '16px 16px 40px' }}>
          <div style={{
            background: darkMode ? '#111' : '#fff',
            border: `1px solid ${borderColor}`,
            borderRadius: 14, padding: 16,
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
              Caption preview
            </p>
            <pre style={{ fontSize: 13, color: darkMode ? '#aaa' : '#374151', fontWeight: 500, whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0, fontFamily: 'inherit' }}>
              {buildCaption().split('\n').map((line, i) => (
                <span key={i}>
                  {line.startsWith('#')
                    ? <span style={{ color: '#10B981', fontWeight: 600 }}>{line}</span>
                    : line
                  }
                  {i < buildCaption().split('\n').length - 1 ? '\n' : ''}
                </span>
              ))}
            </pre>
          </div>
        </div>

        {/* ── Handle prompt sheet ──────────────────────────────────────── */}
        <AnimatePresence>
          {showHandlePrompt && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <motion.div
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)' }}
                variants={overlayFade} initial="initial" animate="animate" exit="exit"
                onClick={() => setShowHandlePrompt(false)}
              />
              <motion.div
                className="relative bg-white dark:bg-[#111] rounded-t-3xl w-full"
                variants={sheetSlide} initial="initial" animate="animate" exit="exit"
              >
                <div style={{ padding: '24px 20px 12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-gray-900 dark:text-white">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <h3 className="text-[18px] font-black text-gray-900 dark:text-white mb-1.5">Add your X handle</h3>
                  <p className="text-[13px] text-gray-400 leading-relaxed mb-5">
                    Your handle appears on every card you share.<br />
                    You can change it anytime in your profile.
                  </p>
                </div>
                <div style={{ padding: '0 20px 28px' }}>
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-gray-400">@</span>
                    <input
                      value={handleInput}
                      onChange={(e) => setHandleInput(e.target.value.replace(/^@+/, ''))}
                      placeholder="yourhandle"
                      autoFocus
                      className="w-full pl-8 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-[#333] bg-[#f8f9fa] dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-[15px] font-semibold outline-none focus:border-tint"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveHandle()}
                    />
                  </div>
                  <motion.button
                    onClick={handleSaveHandle}
                    disabled={savingHandle || !handleInput.trim()}
                    className="w-full py-4 rounded-2xl font-black text-white text-[15px] mb-2 disabled:opacity-50"
                    style={{ backgroundColor: '#10B981' }}
                    whileTap={press.whileTap}
                  >
                    {savingHandle ? 'Saving…' : 'Save handle'}
                  </motion.button>
                  <button onClick={() => setShowHandlePrompt(false)} className="w-full py-3 text-[14px] text-gray-400 font-medium">
                    Skip for now
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Instructions sheet ───────────────────────────────────────── */}
        <AnimatePresence>
          {showInstructions && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <motion.div
                style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)' }}
                variants={overlayFade} initial="initial" animate="animate" exit="exit"
                onClick={() => setShowInstructions(false)}
              />
              <motion.div
                className="relative bg-white dark:bg-[#111] rounded-t-3xl w-full"
                style={{ padding: 24 }}
                variants={sheetSlide} initial="initial" animate="animate" exit="exit"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-tint flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[16px] font-black text-gray-900 dark:text-white leading-snug">Card saved to your device</p>
                    <p className="text-[13px] text-gray-400 font-medium">Now attach it to your post on X</p>
                  </div>
                </div>
                <div className="h-px bg-gray-100 dark:bg-[#333] my-4" />
                <div className="flex flex-col gap-3.5 mb-6">
                  <Step n={1} text="Your Fitnex streak card was just downloaded to Photos or Downloads" />
                  <Step n={2} text="Tap the button below to open X" />
                  <Step n={3} text="Tap the image icon in the X composer" />
                  <Step n={4} text="Select your Fitnex card from photos" />
                </div>
                <motion.button
                  onClick={handleOpenX}
                  className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-white text-[15px] mb-3"
                  style={{ backgroundColor: '#000' }}
                  whileTap={press.whileTap}
                >
                  <XLogo size={17} />
                  Open X
                </motion.button>
                <button onClick={() => setShowInstructions(false)} className="w-full py-2 text-[14px] text-gray-400 font-medium active:opacity-60">
                  Cancel
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Export error toast ───────────────────────────────────────── */}
        <AnimatePresence>
          {exportError && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              style={{ position: 'absolute', bottom: 120, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}
              className="bg-red-600 text-white text-[13px] font-semibold px-4 py-2.5 rounded-2xl shadow-lg whitespace-nowrap"
            >
              {exportError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Handle saved toast ───────────────────────────────────────── */}
        <AnimatePresence>
          {handleToast && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              style={{ position: 'absolute', bottom: 120, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}
              className="bg-gray-900 text-white text-[13px] font-semibold px-4 py-2.5 rounded-2xl shadow-lg whitespace-nowrap"
            >
              Handle saved ✓
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
