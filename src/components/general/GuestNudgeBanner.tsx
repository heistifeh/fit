import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import { overlayFade, sheetSlide, press } from '@/animations/fitnex.variants';
import { useAuthContext } from '@/context/AuthContext';
import useStore from '@/store';

// ─── Compact top banner ───────────────────────────────────────────────────────

export function GuestCompactBanner() {
  return (
    <div className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
      {/* Left */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
          <span className="text-gray-500 font-bold text-[13px]">G</span>
        </div>
        <div>
          <p className="text-[13px] font-bold text-gray-800 leading-snug">Guest user</p>
          <p className="text-[11px] text-gray-400 font-medium leading-snug">Progress not saved</p>
        </div>
      </div>

      {/* Right: amber pill */}
      <span className="bg-amber-100 text-amber-700 text-[11px] font-black px-2.5 py-1 rounded-full shrink-0">
        Guest
      </span>
    </div>
  );
}

// ─── Perk row ─────────────────────────────────────────────────────────────────

function Perk({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-1.5 h-1.5 rounded-full bg-tint shrink-0 mt-[7px]" />
      <p className="text-[13px] text-gray-400 font-medium leading-snug">{text}</p>
    </div>
  );
}

// ─── Bottom sheet nudge ───────────────────────────────────────────────────────

export function GuestNudgeSheet() {
  const { mode, setMode } = useAuthContext();
  const workouts          = useStore((s) => s.workouts);
  const workoutCount      = workouts.length;

  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('nudgeDismissed');
    if (mode === 'guest' && workoutCount >= 1 && !dismissed) {
      // Small delay so the summary screen doesn't clash
      const t = setTimeout(() => setShowNudge(true), 600);
      return () => clearTimeout(t);
    }
  }, [workoutCount, mode]);

  const dismissNudge = () => {
    localStorage.setItem('nudgeDismissed', 'true');
    setShowNudge(false);
  };

  return (
    <AnimatePresence>
      {showNudge && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            variants={overlayFade}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={dismissNudge}
          />

          {/* Sheet */}
          <motion.div
            className="relative bg-white rounded-t-2xl w-full"
            style={{ maxWidth: 390, marginLeft: 'auto', marginRight: 'auto' }}
            variants={sheetSlide}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-9 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="px-5 pb-8">
              {/* Dark inner card */}
              <div
                className="rounded-2xl p-[18px] mb-5"
                style={{ backgroundColor: '#080808' }}
              >
                {/* Card header */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#0d2b1e' }}
                  >
                    <Dumbbell size={18} className="text-tint" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-black leading-snug mb-1"
                      style={{ color: '#ffffff', fontSize: 15 }}
                    >
                      Don't lose your progress
                    </p>
                    <p
                      className="leading-snug"
                      style={{ color: '#777', fontSize: 13, fontWeight: 400 }}
                    >
                      You're building something real. Create a free account to keep it.
                    </p>
                  </div>
                </div>

                {/* Perks */}
                <div className="flex flex-col gap-2">
                  <Perk text="Workout history saved forever" />
                  <Perk text="Track PRs and volume trends" />
                  <Perk text="See your rank among all users" />
                  <Perk text="Share sessions on X" />
                </div>
              </div>

              {/* CTA */}
              <motion.button
                onClick={() => setMode('signup')}
                className="w-full py-[17px] rounded-2xl font-black text-white text-[16px] mb-3"
                style={{ backgroundColor: '#10B981' }}
                whileTap={press.whileTap}
              >
                Create free account
              </motion.button>

              {/* Ghost dismiss */}
              <button
                onClick={dismissNudge}
                className="w-full py-2 text-[14px] text-gray-400 font-medium"
              >
                Continue as guest
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
