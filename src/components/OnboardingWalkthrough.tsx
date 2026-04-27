import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Slide data ───────────────────────────────────────────────────────────────

const slides = [
  {
    id: 'welcome',
    title: 'Welcome to Fitnex 👋',
    desc: 'The workout tracker built for serious lifters. Log every set, beat every record, and share your gains.',
    cta: 'Get started',
    showSkip: true,
  },
  {
    id: 'log',
    title: 'Log every set',
    desc: 'Add exercises, enter your weight and reps, then tap the checkmark to complete a set. Your progress saves automatically.',
    cta: 'Next',
    showSkip: true,
  },
  {
    id: 'pr',
    title: 'Beat your records',
    desc: 'Fitnex automatically detects personal records as you log. Watch your PRs grow over time across every exercise.',
    cta: 'Next',
    showSkip: true,
  },
  {
    id: 'share',
    title: 'Share your gains on X',
    desc: 'After every workout generate a shareable card showing your rank, stats and PRs. See where you stand against other lifters.',
    cta: "Let's go 💪",
    showSkip: false,
  },
] as const;

// ─── Slide illustrations — pure JSX/CSS, no images ───────────────────────────

const SlideIllustration = ({ id }: { id: string }) => {
  if (id === 'welcome') return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      {/* Concentric circles */}
      {[280, 200, 130].map((size, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          border: `1px solid rgba(16,185,129,${0.06 + i * 0.04})`,
        }} />
      ))}
      {/* Center content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#10B981', margin: '0 auto 14px' }} />
        <div style={{ fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 900, color: '#fff', letterSpacing: 3 }}>FITNEX</div>
        <div style={{ fontSize: 12, color: '#10B981', fontWeight: 700, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your gym. Tracked.</div>
      </div>
    </div>
  );

  if (id === 'log') return (
    <div style={{ width: '100%', background: '#111', borderRadius: 18, padding: 16 }}>
      {/* Exercise header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0d2e22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏋️</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Bench Press</div>
          <div style={{ fontSize: 11, color: '#555' }}>3 sets logged</div>
        </div>
      </div>
      {/* Completed sets */}
      {[{ kg: '80', reps: '8' }, { kg: '80', reps: '8' }].map((set, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 32px', gap: 6, alignItems: 'center', marginBottom: 6, background: '#0d2e22', borderRadius: 10, padding: '8px 10px' }}>
          <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700, textAlign: 'center' }}>{i + 1}</span>
          <div style={{ background: '#064e3b', borderRadius: 7, padding: '6px', fontSize: 13, fontWeight: 700, color: '#6ee7b7', textAlign: 'center' }}>{set.kg}</div>
          <div style={{ background: '#064e3b', borderRadius: 7, padding: '6px', fontSize: 13, fontWeight: 700, color: '#6ee7b7', textAlign: 'center' }}>{set.reps}</div>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
        </div>
      ))}
      {/* Active set with pulse ring */}
      <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 32px', gap: 6, alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: '#555', fontWeight: 700, textAlign: 'center' }}>3</span>
        <div style={{ background: '#1a1a1a', borderRadius: 7, padding: '6px', fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'center' }}>82.5</div>
        <div style={{ background: '#1a1a1a', borderRadius: 7, padding: '6px', fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'center' }}>6</div>
        <div style={{ position: 'relative', width: 28, height: 28 }}>
          <div style={{ width: '100%', height: '100%', borderRadius: 8, border: '2px solid #333', background: '#111' }} />
          <div style={{
            position: 'absolute',
            inset: -4,
            borderRadius: 12,
            border: '2px solid #10B981',
            animation: 'onboardPulse 2s ease-in-out infinite',
          }} />
        </div>
      </div>
      <p style={{ fontSize: 11, color: '#10B981', fontWeight: 700, textAlign: 'center', margin: 0 }}>Tap ✓ when you finish a set</p>
      <style>{`@keyframes onboardPulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:0;transform:scale(1.2)}}`}</style>
    </div>
  );

  if (id === 'pr') return (
    <div style={{ width: '100%', background: '#111', borderRadius: 18, padding: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>🏆 New personal record</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>Bench Press</div>
      <div style={{ fontSize: 'clamp(32px, 9vw, 42px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1, margin: '8px 0 4px' }}>
        82.5<span style={{ fontSize: 18, color: '#444' }}>kg</span>
      </div>
      <div style={{ fontSize: 13, color: '#555', marginBottom: 14 }}>6 reps · +2.5kg from last time</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[{ val: '148', lbl: 'workouts' }, { val: '42k', lbl: 'kg lifted' }, { val: '🔥 12', lbl: 'streak' }].map((s, i) => (
          <div key={i} style={{ background: '#1a1a1a', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{s.val}</div>
            <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', marginTop: 2 }}>{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (id === 'share') return (
    <div style={{ width: '100%', background: '#111', borderRadius: 18, padding: 16 }}>
      <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Volume rank this week</div>
      <div style={{ fontSize: 'clamp(36px, 10vw, 44px)', fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>
        Top <span style={{ color: '#10B981' }}>8%</span>
      </div>
      <div style={{ fontSize: 12, color: '#444', margin: '4px 0 12px' }}>of all Fitnex users · this week</div>
      <div style={{ height: 5, background: '#1a1a1a', borderRadius: 3, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '92%', background: '#10B981', borderRadius: 3 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '1px solid #1a1a1a' }}>
        {[{ val: '830kg', lbl: 'Volume' }, { val: '42m', lbl: 'Duration' }, { val: '12', lbl: 'Sets' }].map((s, i) => (
          <div key={i} style={{ padding: '10px 0', textAlign: 'center', borderRight: i < 2 ? '1px solid #1a1a1a' : 'none' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{s.val}</div>
            <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return null;
};

// ─── Main component ───────────────────────────────────────────────────────────

const OnboardingWalkthrough = ({ onComplete }: { onComplete: () => void }) => {
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    if (current < slides.length - 1) setCurrent((prev) => prev + 1);
    else onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Card — full screen on mobile, centered modal on desktop */}
      <div style={{
        width: '100%',
        maxWidth: 430,
        height: '100%',
        maxHeight: '100dvh',
        background: '#080808',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'clamp(0px, calc((100vw - 430px) * 999), 24px)',
        overflow: 'hidden',
      }}>

      {/* Illustration area — fills remaining space */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        minHeight: 0, // critical for flex children to shrink on small screens
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 32px 16px',
            }}
          >
            <SlideIllustration id={slides[current].id} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section — fixed height, never clipped */}
      <div style={{
        flexShrink: 0,
        padding: '20px 28px',
        paddingBottom: 'calc(32px + env(safe-area-inset-bottom))',
        background: '#080808',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 20 }}>
          {slides.map((_, i) => (
            <div
              key={i}
              style={{
                height: 5,
                width: i === current ? 20 : 6,
                borderRadius: 3,
                background: i === current ? '#10B981' : '#222',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Title + description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <h2 style={{
              fontSize: 'clamp(18px, 5vw, 22px)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.5px',
              marginBottom: 8,
              lineHeight: 1.2,
              margin: '0 0 8px',
            }}>
              {slides[current].title}
            </h2>
            <p style={{
              fontSize: 'clamp(13px, 3.5vw, 15px)',
              color: '#555',
              lineHeight: 1.6,
              margin: '0 0 20px',
            }}>
              {slides[current].desc}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {slides[current].showSkip && (
            <button
              onClick={onComplete}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 14,
                color: '#444',
                cursor: 'pointer',
                padding: '14px 8px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Skip
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              flex: 1,
              background: '#10B981',
              border: 'none',
              borderRadius: 14,
              padding: 'clamp(12px, 3.5vw, 16px)',
              fontSize: 'clamp(14px, 3.5vw, 15px)',
              fontWeight: 800,
              color: '#fff',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {slides[current].cta}
          </button>
        </div>
      </div>

      </div>{/* /card */}
    </motion.div>
  );
};

export default OnboardingWalkthrough;
