import { motion } from 'framer-motion';
import { useAuthContext } from '@/context/AuthContext';
import { SPRING } from '@/animations/fitnex.variants';
import splashHero from '@/assets/images/splash-hero.png';

// ─── Variants ─────────────────────────────────────────────────────────────────

const fadeDown = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0, transition: { ...SPRING.soft, delay: 0.05 } },
};

const contentStagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
};

const contentChild = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: SPRING.soft },
};

const buttonStagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.7 } },
};

const buttonChild = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: SPRING.snappy },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SplashScreen() {
  const { setMode, continueAsGuest } = useAuthContext();

  return (
    <div
      style={{
        position: 'relative',
        background: '#080808',
        minHeight: '100dvh',
        maxWidth: 390,
        margin: '0 auto',
        overflow: 'hidden',
      }}
    >
      {/* ── Full-bleed hero image ───────────────────────────────────────── */}
      <img
        src={splashHero}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '70%',
          objectFit: 'cover',
          objectPosition: 'center top',
        }}
      />

      {/* ── Gradient overlay ───────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to bottom, rgba(8,8,8,0.15) 0%, rgba(8,8,8,0.5) 50%, rgba(8,8,8,1) 65%)',
        }}
      />

      {/* ── Content layer ──────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          padding: '52px 28px 0',
          paddingBottom: 'max(40px, env(safe-area-inset-bottom, 24px))',
        }}
      >
        {/* ── Brand row ────────────────────────────────────────────────── */}
        <motion.div
          className="flex items-center gap-2"
          variants={fadeDown}
          initial="initial"
          animate="animate"
        >
          <div
            style={{
              width: 10, height: 10, borderRadius: '50%',
              backgroundColor: '#10B981', flexShrink: 0,
            }}
          />
          <span
            style={{
              color: '#ffffff',
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: '0.14em',
            }}
          >
            FITNEX
          </span>
        </motion.div>

        {/* ── Hero section ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-end">
          <motion.div
            className="flex flex-col gap-4 mb-8"
            variants={contentStagger}
            initial="initial"
            animate="animate"
          >
            {/* Tag */}
            <motion.span
              variants={contentChild}
              style={{
                color: '#10B981',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Your gym. Tracked.
            </motion.span>

            {/* Headline */}
            <motion.h1
              variants={contentChild}
              style={{
                color: '#ffffff',
                fontSize: 38,
                fontWeight: 900,
                letterSpacing: '-1.5px',
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              Train hard.{'\n'}
              Track{' '}
              <span style={{ color: '#10B981' }}>harder.</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={contentChild}
              style={{
                color: '#888',
                fontSize: 15,
                fontWeight: 400,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Show up. Log it. Get stronger.
            </motion.p>
          </motion.div>

          {/* ── Buttons ──────────────────────────────────────────────── */}
          <motion.div
            className="flex flex-col gap-3"
            variants={buttonStagger}
            initial="initial"
            animate="animate"
          >
            {/* Create account */}
            <motion.button
              variants={buttonChild}
              onClick={() => setMode('signup')}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%',
                backgroundColor: '#10B981',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 16,
                padding: '17px 0',
                borderRadius: 16,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Create free account
            </motion.button>

            {/* Sign in */}
            <motion.button
              variants={buttonChild}
              onClick={() => setMode('signin')}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%',
                backgroundColor: '#111',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 16,
                padding: '17px 0',
                borderRadius: 16,
                border: '1.5px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
              }}
            >
              Sign in
            </motion.button>

            {/* Guest */}
            <motion.button
              variants={buttonChild}
              onClick={continueAsGuest}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '10px 0',
              }}
            >
              <span style={{ color: '#555', fontSize: 14, fontWeight: 500 }}>
                or{' '}
                <span
                  style={{
                    color: '#777',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  }}
                >
                  continue as guest
                </span>
              </span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
