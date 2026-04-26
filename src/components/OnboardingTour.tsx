import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePreferences } from '@/context/PreferencesContext';

interface OnboardingTourProps {
  onComplete: () => void;
}

const steps = [
  {
    target: 'stats-row',
    label: 'Step 1 of 4',
    title: 'This is your home base',
    desc: 'Track your sessions, volume and streak at a glance. Everything updates automatically after each workout.',
  },
  {
    target: 'start-workout-btn',
    label: 'Step 2 of 4',
    title: 'Start a workout anytime',
    desc: 'Tap this to begin logging. Add exercises, track sets, weight and reps — the timer runs automatically.',
  },
  {
    target: 'recent-section',
    label: 'Step 3 of 4',
    title: 'Your recent sessions',
    desc: 'Every saved workout appears here. Tap any session to see the full breakdown and share your stats on X.',
  },
  {
    target: 'bottom-nav',
    label: 'Step 4 of 4',
    title: 'Navigate with ease',
    desc: 'History, Stats and Profile live here. The + button starts a new workout from anywhere in the app.',
  },
];

interface Spotlight {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const { darkMode } = usePreferences();
  const [current, setCurrent] = useState(0);
  const [spotlight, setSpotlight] = useState<Spotlight>({ top: 0, left: 0, width: 0, height: 0 });

  const positionSpotlight = (targetId: string) => {
    const el = document.querySelector(`[data-tour="${targetId}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setSpotlight({
      top: rect.top - 6,
      left: rect.left - 6,
      width: rect.width + 12,
      height: rect.height + 12,
    });
  };

  useEffect(() => {
    positionSpotlight(steps[current].target);
  }, [current]);

  // Reposition on resize
  useEffect(() => {
    const handler = () => positionSpotlight(steps[current].target);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [current]);

  const handleNext = () => {
    if (current < steps.length - 1) {
      setCurrent((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('fitnex_onboarding_done', 'true');
    onComplete();
  };

  const step = steps[current];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        {/* Spotlight cutout — the ring highlight around the target */}
        <motion.div
          animate={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            borderRadius: 16,
            border: '2.5px solid #10B981',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
            pointerEvents: 'none',
            zIndex: 1001,
          }}
        />

        {/* Tooltip card */}
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            background: darkMode ? '#111' : '#fff',
            borderRadius: 20,
            padding: '20px 20px 16px',
            margin: '0 16px 32px',
            position: 'relative',
            zIndex: 1002,
            pointerEvents: 'auto',
          }}
        >
          {/* Step label */}
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#10B981',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}>
            {step.label}
          </p>

          {/* Title */}
          <h3 style={{
            fontSize: 17,
            fontWeight: 900,
            color: darkMode ? '#fff' : '#111',
            marginBottom: 6,
            letterSpacing: '-0.3px',
            lineHeight: 1.3,
          }}>
            {step.title}
          </h3>

          {/* Description */}
          <p style={{
            fontSize: 13,
            color: darkMode ? '#888' : '#6b7280',
            lineHeight: 1.6,
            marginBottom: 16,
          }}>
            {step.desc}
          </p>

          {/* Actions row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 5 }}>
              {steps.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 6,
                    width: i === current ? 18 : 6,
                    borderRadius: 3,
                    background: i === current ? '#10B981' : '#e5e7eb',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={handleComplete}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 13,
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '8px 4px',
                  fontWeight: 500,
                }}
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                style={{
                  background: '#10B981',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                {current === steps.length - 1 ? 'Done' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
