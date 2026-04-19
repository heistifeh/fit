import { useRef, useState, useEffect } from 'react';
import { X, Download, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { overlayFade, sheetSlide, prBurst, press } from '@/animations/fitnex.variants';
import { useAuthContext } from '@/context/AuthContext';
import { updateProfile } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShareCardProps = {
  name: string;
  handle: string;
  date: string;
  durationMinutes: number;
  totalVolume: number;
  totalSets: number;
  streak: number;
  hasPR: boolean;
  prExercise: string;
  prKg: number;
  prReps: number;
  onClose: () => void;
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

// The dot notch on the progress bar needs to match the bg
function getDotBorder(bgType: BackgroundType): string {
  if (bgType === 'teal-dark') return '#042f23';
  if (bgType === 'gradient') return '#0a0a0a';
  return '#080808';
}

// X SVG logo
function XLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.857L1.204 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

// ─── Exportable card ──────────────────────────────────────────────────────────

type ShareCardInternalProps = ShareCardProps & {
  cardRef: React.RefObject<HTMLDivElement | null>;
  weeklyRankPct: number;
  cardBgStyle: React.CSSProperties;
  dotBorderColor: string;
};

function ShareCard({
  cardRef,
  name, handle, date,
  durationMinutes, totalVolume, totalSets,
  streak, hasPR, prExercise, prKg, prReps,
  weeklyRankPct,
  cardBgStyle,
  dotBorderColor,
}: ShareCardInternalProps) {

  // handle → "@handle", no handle → name
  const byLine = handle && handle.trim()
    ? (handle.startsWith('@') ? handle : `@${handle}`)
    : name;

  const fillPct = Math.min(95, Math.max(5, 100 - weeklyRankPct));
  const streakDots = Array.from({ length: 10 }, (_, i) => i < streak ? 'orange' : 'dark');

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
        transition: 'background 0.3s ease, background-image 0.3s ease',
      }}
    >
      {/* ── Header row ──────────────────────────────────────────────────── */}
      <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0 }} />
          <span style={{ color: '#ffffff', fontWeight: 900, fontSize: 13, letterSpacing: '0.14em' }}>
            FITNEX
          </span>
        </div>
        <span style={{ color: '#ffffffaa', fontSize: 12, fontWeight: 500 }}>{date}</span>
      </div>

      {/* ── Rank section ────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 24px 0' }}>
        <p style={{ color: '#10B981', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          Volume rank this week
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, lineHeight: 1 }}>
          <span style={{ color: '#ffffff', fontSize: 80, fontWeight: 900, letterSpacing: '-4px' }}>
            Top&nbsp;
          </span>
          <span style={{ color: '#10B981', fontSize: 80, fontWeight: 900, letterSpacing: '-4px' }}>
            {weeklyRankPct}%
          </span>
        </div>
        <p style={{ color: '#ffffffbb', fontSize: 12, fontWeight: 500, marginTop: 2 }}>
          of all Fitnex users · this week
        </p>
      </div>

      {/* ── Progress bar ────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 24px 20px' }}>
        <div style={{ position: 'relative', width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3 }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${fillPct}%`,
            backgroundColor: '#10B981',
            borderRadius: 3,
          }} />
          <div style={{
            position: 'absolute',
            left: `calc(${fillPct}% - 6px)`,
            top: -3,
            width: 12, height: 12,
            borderRadius: '50%',
            backgroundColor: '#10B981',
            border: `2px solid ${dotBorderColor}`,
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ color: '#ffffff66', fontSize: 10, fontWeight: 600 }}>Bottom</span>
          <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700 }}>You are here</span>
          <span style={{ color: '#ffffff66', fontSize: 10, fontWeight: 600 }}>Top</span>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex' }}>
        {[
          { value: `${totalVolume.toLocaleString()}kg`, label: 'Volume' },
          { value: `${durationMinutes}m`,               label: 'Duration' },
          { value: String(totalSets),                    label: 'Sets' },
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
              borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}
          >
            <span style={{ color: '#ffffff', fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1 }}>
              {stat.value}
            </span>
            <span style={{ color: '#ffffff88', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── PR section (conditional) ────────────────────────────────────── */}
      {hasPR && (
        <div style={{ margin: '16px 24px 0', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              New personal record
            </p>
            <p style={{ color: '#ffffff', fontSize: 18, fontWeight: 900, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {prExercise}
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ color: '#ffffff', fontSize: 28, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1 }}>
              {prKg}kg
            </p>
            <p style={{ color: '#ffffff99', fontSize: 11, fontWeight: 600, marginTop: 3 }}>
              {prReps} reps
            </p>
          </div>
        </div>
      )}

      {/* ── Streak section ──────────────────────────────────────────────── */}
      <div style={{ padding: '14px 24px', borderTop: hasPR ? '1px solid rgba(255,255,255,0.08)' : 'none', marginTop: hasPR ? 16 : 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {streakDots.map((type, i) => (
              <div
                key={i}
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: type === 'orange' ? '#f97316' : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>
          <span style={{ color: '#ffffff', fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: '#f97316' }}>{streak}</span> day streak
          </span>
        </div>

        <div style={{
          backgroundColor: '#10B981', borderRadius: 999,
          padding: '6px 14px',
          flexShrink: 0,
        }}>
          <span style={{ color: '#ffffff', fontSize: 12, fontWeight: 800 }}>Join Fitnex</span>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: '#ffffffaa', fontSize: 12, fontWeight: 500 }}>
          by <span style={{ color: '#10B981', fontWeight: 700 }}>{byLine}</span>
        </p>
        <p style={{ color: '#ffffff33', fontSize: 12, fontWeight: 600 }}>fitnex.app</p>
      </div>
    </div>
  );
}

// ─── Spinner (CSS injected once) ─────────────────────────────────────────────

const SPINNER_STYLES = `
  @keyframes fitnex-spin { to { transform: rotate(360deg); } }
  .fitnex-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: fitnex-spin 0.7s linear infinite;
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

// ─── Background picker ────────────────────────────────────────────────────────

type BgOptionProps = {
  selected: boolean;
  onClick: () => void;
  style: React.CSSProperties;
  children?: React.ReactNode;
};

function BgOption({ selected, onClick, style, children }: BgOptionProps) {
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

// ─── Main overlay component ───────────────────────────────────────────────────

export default function WorkoutShareCard(props: ShareCardProps) {
  const { onClose, handle, date, durationMinutes, totalVolume, totalSets,
          streak, hasPR, prExercise, prKg, prReps } = props;

  const { user, refreshProfile } = useAuthContext();

  const cardRef      = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving,            setSaving]            = useState(false);
  const [isGenerating,      setIsGenerating]      = useState(false);
  const [showInstructions,  setShowInstructions]  = useState(false);
  const [exportError,       setExportError]       = useState('');
  const [bgType,            setBgType]            = useState<BackgroundType>('dark');
  const [bgPhotoUrl,        setBgPhotoUrl]        = useState<string | null>(null);
  // Handle prompt
  const [displayHandle,     setDisplayHandle]     = useState(handle);
  const [showHandlePrompt,  setShowHandlePrompt]  = useState(false);
  const [handleInput,       setHandleInput]       = useState('');
  const [savingHandle,      setSavingHandle]      = useState(false);
  const [handleToast,       setHandleToast]       = useState(false);

  // Keep displayHandle in sync if parent updates the prop (e.g. after refreshProfile)
  useEffect(() => { setDisplayHandle(handle); }, [handle]);

  const weeklyRankPct = getPercentile(totalVolume);

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
    } catch (err) {
      console.error('Failed to save handle:', err);
    } finally {
      setSavingHandle(false);
    }
  };

  // Revoke object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => { if (bgPhotoUrl) URL.revokeObjectURL(bgPhotoUrl); };
  }, [bgPhotoUrl]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (bgPhotoUrl) URL.revokeObjectURL(bgPhotoUrl);
    const url = URL.createObjectURL(file);
    setBgPhotoUrl(url);
    setBgType('photo');
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handlePhotoTileClick = () => {
    if (!bgPhotoUrl || bgType !== 'photo') {
      // No photo yet, or photo isn't active — open picker or activate
      if (!bgPhotoUrl) {
        fileInputRef.current?.click();
      } else {
        setBgType('photo');
      }
    } else {
      // Already showing photo — tap again to replace
      fileInputRef.current?.click();
    }
  };

  const removePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bgPhotoUrl) URL.revokeObjectURL(bgPhotoUrl);
    setBgPhotoUrl(null);
    setBgType('dark');
  };

  const cardBgStyle   = getCardBg(bgType, bgPhotoUrl);
  const dotBorderColor = getDotBorder(bgType);

  const showExportError = (msg: string) => {
    setExportError(msg);
    setTimeout(() => setExportError(''), 3500);
  };

  const generateAndDownload = async (filename: string) => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      backgroundColor: null,
      // For photo backgrounds use allowTaint so the object URL renders;
      // for all other backgrounds useCORS is safe and avoids canvas tainting.
      useCORS: bgType !== 'photo',
      allowTaint: bgType === 'photo',
      imageTimeout: 8000,
      logging: false,
    });
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const captionText = [
    `finished today's session.`,
    `top ${weeklyRankPct}% volume on fitnex this week 📈`,
    hasPR ? `new PR — ${prExercise.toLowerCase()} ${prKg}kg` : '',
    `${streak} day streak and counting`,
    ``,
    `#Fitnex #GymLife`,
  ].filter(Boolean).join('\n');

  const captionLines = [
    `finished today's session.`,
    `top ${weeklyRankPct}% volume on fitnex this week 📈`,
    hasPR ? `new PR — ${prExercise.toLowerCase()} ${prKg}kg` : '',
    `${streak} day streak and counting`,
    ``,
    `#Fitnex #GymLife`,
  ].filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== ''));

  const handleShareX = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      await generateAndDownload('fitnex-card.png');
      setShowInstructions(true);
    } catch (err) {
      console.error('Image generation failed:', err);
      showExportError('Could not save image. Try a different background.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenX = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(captionText)}`,
      '_blank',
    );
    setShowInstructions(false);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await generateAndDownload(`fitnex-${date.replace(/[,\s]+/g, '-')}.png`);
    } catch (err) {
      console.error('Save image failed:', err);
      showExportError('Could not save image. Try a different background.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{SPINNER_STYLES}</style>

      <div className="fixed inset-0 z-50 flex flex-col">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          variants={overlayFade}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onClose}
        />

        {/* Main sheet */}
        <motion.div
          className="relative mt-auto w-full max-h-[95vh] overflow-y-auto rounded-t-3xl bg-[#0c0c0c] flex flex-col"
          variants={sheetSlide}
          initial="initial"
          animate="animate"
          exit="exit"
        >

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
            <p className="text-white font-black text-[17px]">Share workout</p>
            <motion.button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#1e1e1e' }}
              whileTap={press.whileTap}
            >
              <X size={16} className="text-gray-400" />
            </motion.button>
          </div>

          {/* Card preview */}
          <motion.div
            className="px-4 pb-4 flex justify-center"
            variants={prBurst}
            initial="initial"
            animate="animate"
          >
            <ShareCard
              cardRef={cardRef}
              name={props.name}
              handle={displayHandle}
              date={date}
              durationMinutes={durationMinutes}
              totalVolume={totalVolume}
              totalSets={totalSets}
              streak={streak}
              hasPR={hasPR}
              prExercise={prExercise}
              prKg={prKg}
              prReps={prReps}
              weeklyRankPct={weeklyRankPct}
              onClose={onClose}
              cardBgStyle={cardBgStyle}
              dotBorderColor={dotBorderColor}
            />
          </motion.div>

          {/* ── Handle nudge ─────────────────────────────────────────────── */}
          {!displayHandle && (
            <div className="px-4 pb-4 shrink-0 flex justify-center">
              <motion.button
                onClick={() => { setHandleInput(''); setShowHandlePrompt(true); }}
                className="w-full flex items-center gap-3 rounded-2xl border"
                style={{
                  background: '#141414',
                  borderColor: '#2a2a2a',
                  padding: '10px 14px',
                  maxWidth: 400,
                  textAlign: 'left',
                }}
                whileTap={press.whileTap}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>
                    Add your X handle
                  </p>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.3 }}>
                    Show your username on shared cards
                  </p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              </motion.button>
            </div>
          )}

          {/* ── Background picker ────────────────────────────────────────── */}
          <div className="px-4 pb-5 shrink-0">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
              Background
            </p>
            <div className="flex gap-3">

              {/* Dark */}
              <BgOption
                selected={bgType === 'dark'}
                onClick={() => setBgType('dark')}
                style={{ backgroundColor: '#080808' }}
              />

              {/* Teal gradient */}
              <BgOption
                selected={bgType === 'gradient'}
                onClick={() => setBgType('gradient')}
                style={{ background: 'linear-gradient(160deg, #0a0a0a 60%, #0d9e6e 100%)' }}
              />

              {/* Teal dark */}
              <BgOption
                selected={bgType === 'teal-dark'}
                onClick={() => setBgType('teal-dark')}
                style={{ backgroundColor: '#042f23' }}
              />

              {/* Photo upload */}
              <BgOption
                selected={bgType === 'photo'}
                onClick={handlePhotoTileClick}
                style={bgPhotoUrl ? {
                  backgroundImage: `url(${bgPhotoUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : { backgroundColor: '#1a1a1a' }}
              >
                {!bgPhotoUrl && (
                  <Camera size={20} className="text-gray-500" />
                )}
                {bgPhotoUrl && (
                  <button
                    onClick={removePhoto}
                    className="absolute top-0.5 right-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                  >
                    <X size={9} className="text-white" />
                  </button>
                )}
              </BgOption>


            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Action buttons */}
          <div className="px-4 flex flex-col gap-3 shrink-0">

            <motion.button
              onClick={handleShareX}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-black text-white text-[15px] transition-opacity disabled:opacity-70"
              style={{ backgroundColor: '#000', border: '1px solid #333' }}
              whileTap={press.whileTap}
            >
              {isGenerating ? (
                <>
                  <span className="fitnex-spinner" />
                  Saving card...
                </>
              ) : (
                <>
                  <XLogo size={17} />
                  Share on X
                </>
              )}
            </motion.button>

            <motion.button
              onClick={handleSave}
              disabled={saving || isGenerating}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-[15px] transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#111', border: '1px solid #1a1a1a', color: '#888' }}
              whileTap={press.whileTap}
            >
              <Download size={16} />
              {saving ? 'Saving…' : 'Save as image'}
            </motion.button>
          </div>

          {/* Caption preview */}
          <div className="px-4 pt-4 pb-8 shrink-0">
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-[#f0f0f0] dark:border-[#1a1a1a] p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Caption preview
              </p>
              <pre className="text-[13px] text-gray-700 dark:text-[#aaa] font-medium whitespace-pre-wrap leading-relaxed">
                {captionLines.map((line, i) => (
                  <span key={i}>
                    {line.startsWith('#')
                      ? <span className="text-tint font-semibold">{line}</span>
                      : line
                    }
                    {i < captionLines.length - 1 ? '\n' : ''}
                  </span>
                ))}
              </pre>
            </div>
          </div>

        </motion.div>

        {/* ── Handle prompt sheet ─────────────────────────────────────────── */}
        <AnimatePresence>
          {showHandlePrompt && (
            <div className="absolute inset-0 z-20 flex flex-col justify-end">
              <motion.div
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                variants={overlayFade}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={() => setShowHandlePrompt(false)}
              />
              <motion.div
                className="relative bg-white dark:bg-[#111] rounded-t-3xl w-full"
                variants={sheetSlide}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div style={{ padding: '24px 20px 12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-gray-900 dark:text-white">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <h3 className="text-[18px] font-black text-gray-900 dark:text-white mb-1.5">
                    Add your X handle
                  </h3>
                  <p className="text-[13px] text-gray-400 leading-relaxed mb-5">
                    Your handle appears on every workout card you share.<br />
                    You can change it anytime in your profile.
                  </p>
                </div>
                <div style={{ padding: '0 20px 28px' }}>
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-gray-400">
                      @
                    </span>
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
                  <button
                    onClick={() => setShowHandlePrompt(false)}
                    className="w-full py-3 text-[14px] text-gray-400 font-medium"
                  >
                    Skip for now
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Export error toast ───────────────────────────────────────────── */}
        <AnimatePresence>
          {exportError && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-[120px] left-1/2 -translate-x-1/2 z-30 bg-red-600 text-white text-[13px] font-semibold px-4 py-2.5 rounded-2xl shadow-lg whitespace-nowrap"
            >
              {exportError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Handle saved toast ───────────────────────────────────────────── */}
        <AnimatePresence>
          {handleToast && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-[120px] left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white text-[13px] font-semibold px-4 py-2.5 rounded-2xl shadow-lg whitespace-nowrap"
            >
              Handle saved ✓
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Instruction sheet (step 2) ──────────────────────────────────── */}
        <AnimatePresence>
          {showInstructions && (
            <div className="absolute inset-0 z-10 flex flex-col justify-end">
              <motion.div
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                variants={overlayFade}
                initial="initial"
                animate="animate"
                exit="exit"
                onClick={() => setShowInstructions(false)}
              />
              <motion.div
                className="relative bg-white dark:bg-[#111] rounded-t-3xl w-full"
                style={{ padding: 24 }}
                variants={sheetSlide}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-tint flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[16px] font-black text-gray-900 dark:text-white leading-snug">
                      Card saved to your device
                    </p>
                    <p className="text-[13px] text-gray-400 font-medium">
                      Now attach it to your post on X
                    </p>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-[#333] my-4" />

                <div className="flex flex-col gap-3.5 mb-6">
                  <Step n={1} text="Your Fitnex card was just downloaded to your Photos or Downloads folder" />
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

                <button
                  onClick={() => setShowInstructions(false)}
                  className="w-full py-2 text-[14px] text-gray-400 font-medium active:opacity-60"
                >
                  Cancel
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
