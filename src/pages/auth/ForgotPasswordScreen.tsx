import { useState } from 'react';
import { ChevronLeft, AlertCircle, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { SPRING } from '@/animations/fitnex.variants';

// ─── Spinner style ────────────────────────────────────────────────────────────

const SPINNER_STYLE = `
  @keyframes fp-spin { to { transform: rotate(360deg); } }
  .fp-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: fp-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
`;

// ─── Slide-in variant ─────────────────────────────────────────────────────────

const slideIn = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { ...SPRING.soft, delay: 0.05 } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.18 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
  const { setMode, resetPassword } = useAuthContext();
  const { darkMode } = usePreferences();

  const [email,      setEmail]      = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [emailSent,  setEmailSent]  = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit  = email !== '' && emailValid && !loading;

  const handleEmailBlur = () => {
    if (email && !emailValid) setEmailError('Enter a valid email');
    else setEmailError('');
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputBase = 'w-full py-[14px] px-4 rounded-xl text-[15px] font-medium outline-none transition-all border-[1.5px]';
  const inputIdle = 'bg-[#f8f9fa] dark:bg-[#1a1a1a] border-[#e5e7eb] dark:border-[#333] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555]';
  const inputFocus = 'focus:bg-white dark:focus:bg-[#222] focus:border-tint';

  return (
    <>
      <style>{SPINNER_STYLE}</style>

      <motion.div
        className="min-h-screen bg-white dark:bg-[#0a0a0a] overflow-y-auto"
        variants={slideIn}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ maxWidth: 390, margin: '0 auto', padding: '52px 24px 32px' }}
      >
        {/* ── Back button ──────────────────────────────────────────────── */}
        {!emailSent && (
          <motion.button
            onClick={() => setMode('signin')}
            className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center mb-8"
            whileTap={{ scale: 0.93 }}
          >
            <ChevronLeft size={20} className="text-gray-600 dark:text-[#aaa]" />
          </motion.button>
        )}

        {emailSent ? (

          /* ── Confirmation state ──────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 40 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: darkMode ? '#0d2e22' : '#f0fdf4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, fontSize: 32,
            }}>
              📬
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: darkMode ? '#fff' : '#111', marginBottom: 8 }}>
              Check your email
            </h2>
            <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>
              We sent a reset link to
            </p>
            <p style={{ color: darkMode ? '#e5e7eb' : '#111', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
              {email}
            </p>
            <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, marginBottom: 32, maxWidth: 260 }}>
              Click the link to set a new password. Didn't get it? Check your spam folder.
            </p>
            <button
              onClick={() => setMode('signin')}
              style={{ width: '100%', background: '#10B981', border: 'none', borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 800, color: '#fff', cursor: 'pointer' }}
            >
              Back to sign in
            </button>
          </div>

        ) : (

          /* ── Request form ────────────────────────────────────────────── */
          <>
            <div className="mb-8">
              <h1
                className="text-gray-900 dark:text-white mb-1.5"
                style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.8px', lineHeight: 1.2 }}
              >
                Reset password
              </h1>
              <p className="text-[14px] text-gray-400 font-medium leading-snug">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleReset} className="flex flex-col gap-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                    onBlur={handleEmailBlur}
                    autoFocus
                    className={`${inputBase} ${inputFocus} pr-11 ${
                      emailError
                        ? 'bg-red-50 border-red-400 text-gray-900'
                        : inputIdle
                    }`}
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {emailError ? (
                      <AlertCircle size={17} className="text-red-400" />
                    ) : email && emailValid ? (
                      <div className="w-5 h-5 rounded-full bg-tint flex items-center justify-center">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    ) : null}
                  </div>
                </div>
                {emailError && (
                  <p className="mt-1.5 text-[12px] text-red-500 font-medium">{emailError}</p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={!canSubmit}
                className="w-full flex items-center justify-center gap-2 py-[17px] rounded-2xl font-black text-[16px] text-white transition-opacity"
                style={{ backgroundColor: canSubmit ? '#10B981' : '#d1d5db' }}
                whileTap={canSubmit ? { scale: 0.97 } : {}}
              >
                {loading ? (
                  <>
                    <span className="fp-spinner" />
                    Sending…
                  </>
                ) : (
                  'Send reset link'
                )}
              </motion.button>

              {error && (
                <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                  {error}
                </p>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-[14px] text-gray-500">
                Remember it?{' '}
                <button onClick={() => setMode('signin')} className="text-tint font-semibold">
                  Sign in
                </button>
              </p>
            </div>
          </>

        )}
      </motion.div>
    </>
  );
}
