import { useRef, useState } from 'react';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { overlayFade, sheetSlide, prBurst, press } from '@/animations/fitnex.variants';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPercentile(volume: number): number {
  if (volume >= 1500) return 3;
  if (volume >= 1000) return 8;
  if (volume >= 700)  return 15;
  if (volume >= 400)  return 35;
  return 60;
}

// X SVG logo
function XLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.857L1.204 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

// ─── Exportable dark card ─────────────────────────────────────────────────────

function ShareCard({
  cardRef,
  name, handle, date,
  durationMinutes, totalVolume, totalSets,
  streak, hasPR, prExercise, prKg, prReps,
  weeklyRankPct,
}: ShareCardProps & { cardRef: React.RefObject<HTMLDivElement | null>; weeklyRankPct: number }) {

  const fillPct = Math.min(95, Math.max(5, 100 - weeklyRankPct));
  const streakDots = Array.from({ length: 10 }, (_, i) => i < streak ? 'orange' : 'dark');

  return (
    <div
      ref={cardRef}
      style={{
        backgroundColor: '#080808',
        borderRadius: 22,
        overflow: 'hidden',
        maxWidth: 400,
        width: '100%',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
        <span style={{ color: '#444', fontSize: 12, fontWeight: 500 }}>{date}</span>
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
        <p style={{ color: '#555', fontSize: 12, fontWeight: 500, marginTop: 2 }}>
          of all Fitnex users · this week
        </p>
      </div>

      {/* ── Progress bar ────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 24px 20px' }}>
        <div style={{ position: 'relative', width: '100%', height: 6, backgroundColor: '#1a1a1a', borderRadius: 3 }}>
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
            border: '2px solid #080808',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ color: '#444', fontSize: 10, fontWeight: 600 }}>Bottom</span>
          <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700 }}>You are here</span>
          <span style={{ color: '#444', fontSize: 10, fontWeight: 600 }}>Top</span>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111', display: 'flex' }}>
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
              borderRight: i < arr.length - 1 ? '1px solid #111' : 'none',
            }}
          >
            <span style={{ color: '#ffffff', fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1 }}>
              {stat.value}
            </span>
            <span style={{ color: '#444', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── PR section (conditional) ────────────────────────────────────── */}
      {hasPR && (
        <div style={{ margin: '16px 24px 0', backgroundColor: '#0f0f0f', borderRadius: 12, border: '1px solid #1a1a1a', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
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
            <p style={{ color: '#555', fontSize: 11, fontWeight: 600, marginTop: 3 }}>
              {prReps} reps
            </p>
          </div>
        </div>
      )}

      {/* ── Streak section ──────────────────────────────────────────────── */}
      <div style={{ padding: '14px 24px', borderTop: hasPR ? '1px solid #111' : 'none', marginTop: hasPR ? 16 : 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {streakDots.map((type, i) => (
              <div
                key={i}
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: type === 'orange' ? '#f97316' : '#1a1a1a',
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
      <div style={{ padding: '12px 24px 20px', borderTop: '1px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: '#555', fontSize: 12, fontWeight: 500 }}>
          by <span style={{ color: '#10B981', fontWeight: 700 }}>{handle}</span>
        </p>
        <p style={{ color: '#2a2a2a', fontSize: 12, fontWeight: 600 }}>fitnex.app</p>
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
      <p className="text-[14px] text-gray-700 font-medium leading-snug pt-0.5">{text}</p>
    </div>
  );
}

// ─── Main overlay component ───────────────────────────────────────────────────

export default function WorkoutShareCard(props: ShareCardProps) {
  const { onClose, handle, date, durationMinutes, totalVolume, totalSets,
          streak, hasPR, prExercise, prKg, prReps } = props;

  const cardRef       = useRef<HTMLDivElement>(null);
  const [saving,           setSaving]           = useState(false);
  const [isGenerating,     setIsGenerating]     = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const weeklyRankPct = getPercentile(totalVolume);

  const generateAndDownload = async (filename: string) => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      backgroundColor: '#080808',
      useCORS: true,
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
              handle={handle}
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
            />
          </motion.div>

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
            <div className="bg-white rounded-2xl border border-[#f0f0f0] p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Caption preview
              </p>
              <pre className="text-[13px] text-gray-700 font-medium whitespace-pre-wrap leading-relaxed">
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
                className="relative bg-white rounded-t-3xl w-full"
                style={{ padding: 24 }}
                variants={sheetSlide}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-tint flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[16px] font-black text-gray-900 leading-snug">
                      Card saved to your device
                    </p>
                    <p className="text-[13px] text-gray-400 font-medium">
                      Now attach it to your post on X
                    </p>
                  </div>
                </div>

                <div className="h-px bg-gray-100 my-4" />

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
