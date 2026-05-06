import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { staggerChild, staggerContainer, prBurst } from '@/animations/fitnex.variants';

// ─── Quiz data ────────────────────────────────────────────────────────────────

const QUIZ_STEPS = [
  {
    id: 'goal',
    image: '/quiz/quiz-goal.png',
    title: "What's your\nmain goal?",
    subtitle: "We'll personalise Fitnex around what matters most to you.",
    type: 'single' as const,
    options: [
      { id: 'muscle',     label: 'Build muscle',   desc: 'Increase size and strength' },
      { id: 'lose',       label: 'Lose weight',     desc: 'Burn fat and get leaner' },
      { id: 'strength',   label: 'Get stronger',    desc: 'Improve performance and PRs' },
      { id: 'consistent', label: 'Stay consistent', desc: 'Build a sustainable habit' },
    ],
  },
  {
    id: 'frequency',
    image: '/quiz/quiz-frequency.png',
    title: "How often do\nyou train?",
    subtitle: "Be honest — we'll set realistic expectations for your streak.",
    type: 'grid' as const,
    options: [
      { id: 'beginner',  label: 'Just starting', desc: '1-2x per week' },
      { id: 'casual',    label: 'Casual',         desc: '2-3x per week' },
      { id: 'dedicated', label: 'Dedicated',      desc: '4-5x per week' },
      { id: 'daily',     label: 'Daily',          desc: '6-7x per week' },
    ],
  },
  {
    id: 'equipment',
    image: '/quiz/quiz-equipment.png',
    title: "What's your\nsetup?",
    subtitle: "We'll suggest relevant exercises based on what you have.",
    type: 'single' as const,
    options: [
      { id: 'full',       label: 'Full gym',       desc: 'Barbells, machines, cables' },
      { id: 'home',       label: 'Home gym',        desc: 'Dumbbells and basic equipment' },
      { id: 'bodyweight', label: 'Bodyweight only', desc: 'No equipment needed' },
    ],
  },
  {
    id: 'experience',
    image: '/quiz/quiz-experience.png',
    title: "How long have\nyou been lifting?",
    subtitle: "This helps us calibrate what counts as a PR for you.",
    type: 'single' as const,
    options: [
      { id: 'newbie',       label: 'Less than 6 months', desc: 'Still learning the basics' },
      { id: 'intermediate', label: '6 months — 2 years',  desc: 'Getting comfortable' },
      { id: 'advanced',     label: '2 — 5 years',         desc: 'Intermediate lifter' },
      { id: 'expert',       label: '5+ years',             desc: 'Experienced lifter' },
    ],
  },
  {
    id: 'challenge',
    image: '/quiz/quiz-challenge.png',
    title: "What's your\nbiggest challenge?",
    subtitle: "We'll focus on fixing this first.",
    type: 'single' as const,
    autoAdvance: true,
    options: [
      { id: 'tracking',    label: 'Tracking progress',   desc: "Hard to know if I'm improving" },
      { id: 'consistency', label: 'Staying consistent',  desc: 'Missing sessions too often' },
      { id: 'logging',     label: 'Knowing what to log', desc: "Not sure what data matters" },
      { id: 'goals',       label: 'Hitting my goals',    desc: 'Progress feels too slow' },
    ],
  },
] as const;

type Step = typeof QUIZ_STEPS[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getGoalText = (goal: string) =>
  ({ muscle: 'build muscle', lose: 'lose weight', strength: 'get stronger', consistent: 'stay consistent' }[goal] ?? 'reach your goals');

const getAnswerLabel = (key: string, value: string): string => {
  const step = QUIZ_STEPS.find((s) => s.id === key);
  return step?.options.find((o) => o.id === value)?.label ?? value;
};

// ─── Shared option renderer ───────────────────────────────────────────────────

function Options({
  step,
  answers,
  onSelect,
}: {
  step: Step;
  answers: Record<string, string>;
  onSelect: (stepId: string, optionId: string) => void;
}) {
  if (step.type === 'grid') {
    return (
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
      >
        {step.options.map((option) => (
          <motion.button
            key={option.id}
            variants={staggerChild}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(step.id, option.id)}
            style={{
              background: answers[step.id] === option.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${answers[step.id] === option.id ? '#10B981' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 14,
              padding: '20px 14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{option.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{option.desc}</div>
          </motion.button>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {step.options.map((option) => (
        <motion.button
          key={option.id}
          variants={staggerChild}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(step.id, option.id)}
          style={{
            background: answers[step.id] === option.id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1.5px solid ${answers[step.id] === option.id ? '#10B981' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 14,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease',
            width: '100%',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{option.label}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{option.desc}</div>
          </div>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            border: `2px solid ${answers[step.id] === option.id ? '#10B981' : 'rgba(255,255,255,0.2)'}`,
            background: answers[step.id] === option.id ? '#10B981' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}>
            {answers[step.id] === option.id && <Check size={11} color="white" strokeWidth={3} />}
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}

// ─── Mobile slide background ──────────────────────────────────────────────────

function SlideBackground({ image }: { image: string }) {
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, #080808 0%, rgba(8,8,8,0.5) 30%, rgba(8,8,8,0.3) 50%, rgba(8,8,8,0.8) 70%, #080808 90%)',
        zIndex: 1,
      }} />
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const OnboardingQuiz = () => {
  const { setMode } = useAuthContext();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const step = QUIZ_STEPS[currentStep];

  const handleSelect = (stepId: string, optionId: string) => {
    const updated = { ...answers, [stepId]: optionId };
    setAnswers(updated);
    const s = QUIZ_STEPS.find((q) => q.id === stepId);
    if (s && 'autoAdvance' in s && s.autoAdvance) {
      setTimeout(() => {
        localStorage.setItem('fitnex_quiz_answers', JSON.stringify(updated));
        setShowResult(true);
      }, 400);
    }
  };

  const handleContinue = () => {
    if (currentStep < QUIZ_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      localStorage.setItem('fitnex_quiz_answers', JSON.stringify(answers));
      setShowResult(true);
    }
  };

  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      setMode('splash');
    }
  };

  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const isAutoAdvance = 'autoAdvance' in step && step.autoAdvance;

  // ── Desktop result ─────────────────────────────────────────────────────────

  if (isDesktop && showResult) {
    return (
      <motion.div
        variants={prBurst}
        initial="initial"
        animate="animate"
        style={{ display: 'flex', height: '100dvh', background: '#080808', overflow: 'hidden', fontFamily: font }}
      >
        {/* Left — image */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <img
            src="/quiz/quiz-result.png"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
          />
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 120, background: 'linear-gradient(to right, transparent, #080808)' }} />
          <div style={{ position: 'absolute', top: 32, left: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: 2 }}>FITNEX</span>
          </div>
        </div>

        {/* Right — result content */}
        <div style={{ width: 480, flexShrink: 0, background: '#080808', display: 'flex', flexDirection: 'column', padding: '48px 40px', overflowY: 'auto' }}>
          <button
            onClick={handleBack}
            style={{ width: 36, height: 36, borderRadius: 10, background: '#1a1a1a', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 40 }}
          >
            <ChevronLeft size={18} color="#fff" />
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Fitnex is ready for you
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -0.8, lineHeight: 1.2, margin: '0 0 8px' }}>
              Your personal<br />workout tracker
            </h2>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 24, lineHeight: 1.6 }}>
              Based on your answers we've set Fitnex up to help you {getGoalText(answers.goal)}, stay consistent and hit new PRs.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(answers).map(([key, value]) => (
                <div key={key} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#10B981' }}>
                  {getAnswerLabel(key, value)}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 32 }}>
            <button
              onClick={() => setMode('signup')}
              style={{ width: '100%', background: '#10B981', border: 'none', borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 800, color: '#fff', cursor: 'pointer' }}
            >
              Create free account
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Mobile result ──────────────────────────────────────────────────────────

  if (showResult) {
    return (
      <motion.div
        variants={prBurst}
        initial="initial"
        animate="animate"
        style={{
          position: 'fixed', inset: 0, background: '#080808',
          minHeight: '100dvh', maxWidth: 430, margin: '0 auto',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: font,
        }}
      >
        <SlideBackground image="/quiz/quiz-result.png" />

        <div style={{ position: 'relative', zIndex: 2, padding: '52px 20px 0' }}>
          <button
            onClick={handleBack}
            style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronLeft size={18} color="#fff" />
          </button>
        </div>

        <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 20px' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              Fitnex is ready for you
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: -1, lineHeight: 1.2, margin: '0 0 8px' }}>
              Your personal<br />workout tracker
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 1.6 }}>
              Based on your answers we've set Fitnex up to help you {getGoalText(answers.goal)}, stay consistent and hit new PRs.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {Object.entries(answers).map(([key, value]) => (
                <div key={key} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#10B981' }}>
                  {getAnswerLabel(key, value)}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setMode('signup')}
            style={{ width: '100%', background: '#10B981', border: 'none', borderRadius: 16, padding: 17, fontSize: 16, fontWeight: 800, color: '#fff', cursor: 'pointer', marginBottom: 'calc(32px + env(safe-area-inset-bottom))' }}
          >
            Create free account
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Desktop quiz ───────────────────────────────────────────────────────────

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', height: '100dvh', background: '#080808', overflow: 'hidden', fontFamily: font }}>
        {/* Left — animated image */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={currentStep}
              src={step.image}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', position: 'absolute', inset: 0 }}
            />
          </AnimatePresence>
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 120, background: 'linear-gradient(to right, transparent, #080808)' }} />
          <div style={{ position: 'absolute', top: 32, left: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: 2 }}>FITNEX</span>
          </div>
        </div>

        {/* Right — quiz content */}
        <div style={{ width: 480, flexShrink: 0, background: '#080808', display: 'flex', flexDirection: 'column', padding: '48px 40px', overflowY: 'auto' }}>
          {/* Progress bar */}
          <div style={{ height: 3, background: '#1a1a1a', borderRadius: 2, marginBottom: 40 }}>
            <motion.div
              animate={{ width: `${((currentStep + 1) / QUIZ_STEPS.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              style={{ height: '100%', background: '#10B981', borderRadius: 2 }}
            />
          </div>

          {/* Step count + skip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 12, color: '#444', fontWeight: 600 }}>{currentStep + 1} of {QUIZ_STEPS.length}</span>
            <button onClick={() => setMode('signup')} style={{ background: 'none', border: 'none', fontSize: 13, color: '#444', cursor: 'pointer' }}>Skip</button>
          </div>

          {/* Animated question + options */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              style={{ flex: 1 }}
            >
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -0.8, lineHeight: 1.2, margin: '0 0 8px', whiteSpace: 'pre-line' }}>
                {step.title}
              </h2>
              <p style={{ fontSize: 14, color: '#555', marginBottom: 28, lineHeight: 1.6 }}>
                {step.subtitle}
              </p>
              <Options step={step} answers={answers} onSelect={handleSelect} />
            </motion.div>
          </AnimatePresence>

          {/* Bottom actions */}
          <div style={{ marginTop: 'auto', paddingTop: 24 }}>
            {!isAutoAdvance && (
              <button
                onClick={handleContinue}
                disabled={!answers[step.id]}
                style={{
                  width: '100%',
                  background: answers[step.id] ? '#10B981' : '#1a1a1a',
                  border: 'none',
                  borderRadius: 14,
                  padding: 16,
                  fontSize: 15,
                  fontWeight: 800,
                  color: answers[step.id] ? '#fff' : '#333',
                  cursor: answers[step.id] ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  marginBottom: 12,
                }}
              >
                {currentStep === QUIZ_STEPS.length - 1 ? 'See my plan' : 'Continue'}
              </button>
            )}
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                style={{ width: '100%', background: 'none', border: 'none', fontSize: 14, color: '#444', cursor: 'pointer', padding: '10px 0' }}
              >
                Back
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Mobile quiz ────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: '#080808',
        minHeight: '100dvh', maxWidth: 430, margin: '0 auto',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: font,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
        >
          <SlideBackground image={step.image} />

          {/* Header */}
          <div style={{ position: 'relative', zIndex: 2, padding: '52px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={handleBack}
              style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ChevronLeft size={18} color="#fff" />
            </button>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              {currentStep + 1} of {QUIZ_STEPS.length}
            </span>
            <button
              onClick={() => setMode('signup')}
              style={{ background: 'none', border: 'none', fontSize: 13, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '8px 4px' }}
            >
              Skip
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ position: 'relative', zIndex: 2, padding: '12px 20px 0' }}>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <motion.div
                animate={{ width: `${((currentStep + 1) / QUIZ_STEPS.length) * 100}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                style={{ height: '100%', background: '#10B981', borderRadius: 2 }}
              />
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Question title */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            style={{ position: 'relative', zIndex: 2, padding: '0 20px' }}
          >
            <motion.h2
              variants={staggerChild}
              style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: -1, lineHeight: 1.15, margin: '0 0 8px', whiteSpace: 'pre-line' }}
            >
              {step.title}
            </motion.h2>
            <motion.p
              variants={staggerChild}
              style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20, lineHeight: 1.5 }}
            >
              {step.subtitle}
            </motion.p>
          </motion.div>

          {/* Options */}
          <div style={{ position: 'relative', zIndex: 2, padding: '0 20px' }}>
            <Options step={step} answers={answers} onSelect={handleSelect} />
          </div>

          {/* Continue button */}
          {!isAutoAdvance && (
            <div style={{ position: 'relative', zIndex: 2, padding: '16px 20px', paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}>
              <button
                onClick={handleContinue}
                disabled={!answers[step.id]}
                style={{
                  width: '100%',
                  background: answers[step.id] ? '#10B981' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: 16,
                  padding: 17,
                  fontSize: 16,
                  fontWeight: 800,
                  color: answers[step.id] ? '#fff' : 'rgba(255,255,255,0.3)',
                  cursor: answers[step.id] ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                }}
              >
                {currentStep === QUIZ_STEPS.length - 1 ? 'See my plan' : 'Continue'}
              </button>
            </div>
          )}

          {isAutoAdvance && (
            <div style={{ height: 'calc(16px + env(safe-area-inset-bottom))', position: 'relative', zIndex: 2 }} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OnboardingQuiz;
