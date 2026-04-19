import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { SPRING } from '@/animations/fitnex.variants';

// ─── Spinner / autofill styles ────────────────────────────────────────────────

const STYLES = `
  @keyframes rp-spin { to { transform: rotate(360deg); } }
  .rp-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: rp-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 30px #f8f9fa inset !important;
    -webkit-text-fill-color: #111 !important;
  }
  .dark input:-webkit-autofill,
  .dark input:-webkit-autofill:hover,
  .dark input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 30px #1a1a1a inset !important;
    -webkit-text-fill-color: #fff !important;
  }
`;

// ─── Password strength ────────────────────────────────────────────────────────

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function getStrength(password: string): StrengthLevel {
  if (!password) return 0;
  const len = password.length;
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const hasNumber  = /\d/.test(password);
  if (len >= 12 && (hasSpecial || hasNumber)) return 4;
  if (len >= 8  && (hasSpecial || hasNumber)) return 3;
  if (len >= 6)                               return 2;
  return 1;
}

const STRENGTH_CONFIG: Record<StrengthLevel, { label: string; color: string; bars: number }> = {
  0: { label: '',            color: '#e5e7eb', bars: 0 },
  1: { label: 'Weak',        color: '#ef4444', bars: 1 },
  2: { label: 'Fair',        color: '#f59e0b', bars: 2 },
  3: { label: 'Strong',      color: '#10B981', bars: 3 },
  4: { label: 'Very strong', color: '#10B981', bars: 4 },
};

function StrengthMeter({ password }: { password: string }) {
  const level = getStrength(password);
  const cfg   = STRENGTH_CONFIG[level];
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-1 h-[4px] rounded-full transition-colors duration-300"
            style={{ backgroundColor: i <= cfg.bars ? cfg.color : '#e5e7eb' }}
          />
        ))}
      </div>
      <p className="text-[12px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
    </div>
  );
}

// ─── Slide-in variant ─────────────────────────────────────────────────────────

const slideIn = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { ...SPRING.soft, delay: 0.05 } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.18 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResetPasswordScreen() {
  const { setMode } = useAuthContext();
  const { darkMode } = usePreferences();

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [done,            setDone]            = useState(false);

  const canSubmit = password.length >= 8 && confirmPassword.length >= 1 && !loading;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputBase = 'w-full py-[14px] px-4 rounded-xl text-[15px] font-medium outline-none transition-all border-[1.5px]';
  const inputIdle = 'bg-[#f8f9fa] dark:bg-[#1a1a1a] border-[#e5e7eb] dark:border-[#333] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555]';
  const inputFocus = 'focus:bg-white dark:focus:bg-[#222] focus:border-tint';

  if (done) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: darkMode ? '#0a0a0a' : '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '40px 24px',
          maxWidth: 390,
          margin: '0 auto',
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 20 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: darkMode ? '#fff' : '#111', marginBottom: 8 }}>
          Password updated
        </h2>
        <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, marginBottom: 32 }}>
          Your password has been changed successfully.
        </p>
        <button
          onClick={() => setMode('signin')}
          style={{ width: '100%', background: '#10B981', border: 'none', borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 800, color: '#fff', cursor: 'pointer' }}
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{STYLES}</style>

      <motion.div
        className="min-h-screen bg-white dark:bg-[#0a0a0a] overflow-y-auto"
        variants={slideIn}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ maxWidth: 390, margin: '0 auto', padding: '52px 24px 32px' }}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1
            className="text-gray-900 dark:text-white mb-1.5"
            style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.8px', lineHeight: 1.2 }}
          >
            New password
          </h1>
          <p className="text-[14px] text-gray-400 font-medium leading-snug">
            Choose a strong password for your account.
          </p>
        </div>

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <form onSubmit={handleReset} className="flex flex-col gap-5">

          {/* New password */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              New password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className={`${inputBase} ${inputIdle} ${inputFocus} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 p-0.5"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            <StrengthMeter password={password} />
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(null); }}
                className={`${inputBase} ${inputIdle} ${inputFocus} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 p-0.5"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: -8 }}>
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 py-[17px] rounded-2xl font-black text-[16px] text-white transition-opacity"
            style={{ backgroundColor: canSubmit ? '#10B981' : '#d1d5db' }}
            whileTap={canSubmit ? { scale: 0.97 } : {}}
          >
            {loading ? (
              <>
                <span className="rp-spinner" />
                Updating…
              </>
            ) : (
              'Update password'
            )}
          </motion.button>

        </form>
      </motion.div>
    </>
  );
}
