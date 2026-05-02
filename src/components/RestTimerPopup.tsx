import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Volume2, VolumeX } from 'lucide-react';

interface RestTimerPopupProps {
  exerciseName: string;
  setNumber: number;
  nextSetNumber: number;
  defaultSeconds: number;
  onClose: () => void;
}

const MOTIVES = [
  'Rest up 💤',
  'You earned it 🙌',
  'Next set incoming...',
  'Stay focused 🎯',
  'Breathe 🧘',
  'Almost there ⚡',
];

const PRESETS     = [45, 60, 90, 120, 180];
const PRESET_LBLS = ['45s', '1m', '1.5m', '2m', '3m'];

const circumference = 2 * Math.PI * 60;

function storageKey(name: string) {
  return `fitnex_rest_${name.toLowerCase().replace(/\s+/g, '_')}`;
}

function RestTimerPopup({
  exerciseName, setNumber, nextSetNumber, defaultSeconds, onClose,
}: RestTimerPopupProps) {
  const getInitial = () => {
    const saved = localStorage.getItem(storageKey(exerciseName));
    if (saved) {
      const n = parseInt(saved, 10);
      if (n >= 5 && n <= 600) return n;
    }
    return defaultSeconds;
  };

  const [totalSecs,  setTotalSecs]  = useState(getInitial);
  const [secs,       setSecs]       = useState(getInitial);
  const [motiveIdx,  setMotiveIdx]  = useState(0);
  const [soundOn,    setSoundOn]    = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = () => {
    clearInterval(intervalRef.current!);
    intervalRef.current = setInterval(() => {
      setSecs((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          setTimeout(onClose, 600);
          return 0;
        }
        if ((prev - 1) % 20 === 0) {
          setMotiveIdx((i) => (i + 1) % MOTIVES.length);
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startCountdown();
    return () => clearInterval(intervalRef.current!);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const adjustTime = (delta: number) => {
    setSecs((prev) => Math.max(5, Math.min(prev + delta, 600)));
  };

  const setPreset = (s: number) => {
    localStorage.setItem(storageKey(exerciseName), String(s));
    setTotalSecs(s);
    setSecs(s);
    clearInterval(intervalRef.current!);
    setTimeout(startCountdown, 50);
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const progress   = totalSecs > 0 ? secs / totalSecs : 0;
  const ringOffset = circumference * (1 - progress);
  const isWarning  = secs <= 20 && secs > 10;
  const isUrgent   = secs <= 10;
  const ringColor  = isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#10B981';
  const numColor   = isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#fff';

  return (
    <AnimatePresence>
      {/* Full-screen overlay — tap outside to dismiss */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 500, padding: '0 20px',
        }}
      >
        {/* Timer card — stops tap propagation */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#111', borderRadius: 26,
            padding: '24px 24px 20px', width: '100%', maxWidth: 320,
            textAlign: 'center', position: 'relative',
          }}
        >
          {/* Sound toggle */}
          <button
            onClick={() => setSoundOn((p) => !p)}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 28, height: 28, background: '#1a1a1a', border: 'none',
              borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
            }}
          >
            {soundOn
              ? <Volume2 size={13} color="#555" />
              : <VolumeX size={13} color="#333" />}
          </button>

          {/* Rotating motivational label */}
          <AnimatePresence mode="wait">
            <motion.p
              key={motiveIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4, height: 18 }}
            >
              {MOTIVES[motiveIdx]}
            </motion.p>
          </AnimatePresence>

          {/* Set-complete badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#0d2e22', borderRadius: 20, padding: '4px 10px',
            fontSize: 11, fontWeight: 700, color: '#10B981', marginBottom: 16,
          }}>
            <Check size={10} strokeWidth={3} />
            {exerciseName} · Set {setNumber} complete
          </div>

          {/* SVG ring + countdown */}
          <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto 16px' }}>
            <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="65" cy="65" r="60" fill="none" stroke="#1a1a1a" strokeWidth="10" />
              <circle
                cx="65" cy="65" r="60" fill="none"
                stroke={ringColor} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 38, fontWeight: 900, color: numColor,
              letterSpacing: -2, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              transition: 'color 0.3s ease',
            }}>
              {fmt(secs)}
            </div>
          </div>

          {/* ±15 s row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 14 }}>
            <button
              onClick={() => adjustTime(-15)}
              style={{ width: 44, height: 36, borderRadius: 10, background: '#1a1a1a', border: 'none', fontSize: 12, fontWeight: 800, color: '#ef4444', cursor: 'pointer' }}
            >
              -15s
            </button>
            <span style={{ fontSize: 11, color: '#444', fontWeight: 600, width: 56, textAlign: 'center' }}>
              {totalSecs}s rest
            </span>
            <button
              onClick={() => adjustTime(15)}
              style={{ width: 44, height: 36, borderRadius: 10, background: '#1a1a1a', border: 'none', fontSize: 12, fontWeight: 800, color: '#10B981', cursor: 'pointer' }}
            >
              +15s
            </button>
          </div>

          {/* Preset pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, justifyContent: 'center' }}>
            {PRESETS.map((p, i) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                style={{
                  flex: 1,
                  background:  totalSecs === p ? '#0d2e22' : '#1a1a1a',
                  border:      totalSecs === p ? '1px solid #10B981' : '1px solid transparent',
                  borderRadius: 10, padding: '8px 4px',
                  fontSize: 11, fontWeight: 700,
                  color:   totalSecs === p ? '#10B981' : '#555',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {PRESET_LBLS[i]}
              </button>
            ))}
          </div>

          {/* Skip */}
          <button
            onClick={onClose}
            style={{
              width: '100%', background: '#10B981', border: 'none',
              borderRadius: 12, padding: 13,
              fontSize: 14, fontWeight: 800, color: '#fff', cursor: 'pointer',
            }}
          >
            Skip rest
          </button>

          {/* Next-up hint */}
          <p style={{ fontSize: 11, color: '#333', marginTop: 12 }}>
            Next up:{' '}
            <span style={{ color: '#10B981', fontWeight: 700 }}>
              Set {nextSetNumber} · {exerciseName}
            </span>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default RestTimerPopup;
