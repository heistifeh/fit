import { useState } from 'react';
import { ChevronLeft, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/context/AuthContext';
import { SPRING } from '@/animations/fitnex.variants';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// ─── Autofill override ────────────────────────────────────────────────────────

const AUTOFILL_STYLE = `
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

// ─── Spinner style ────────────────────────────────────────────────────────────

const SPINNER_STYLE = `
  @keyframes si-spin { to { transform: rotate(360deg); } }
  .si-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: si-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
`;

// ─── Google SVG logo ──────────────────────────────────────────────────────────

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Slide-in variant ─────────────────────────────────────────────────────────

const slideIn = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { ...SPRING.soft, delay: 0.05 } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.18 } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignInScreen() {
  const { setMode, signIn, signInWithGoogle } = useAuthContext();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError,   setEmailError]   = useState('');
  const [error,        setError]        = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit  = email !== '' && emailValid && password.length >= 1 && !loading;

  const handleEmailBlur = () => {
    if (email && !emailValid) setEmailError('Enter a valid email');
    else setEmailError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputBase  = 'w-full py-[14px] px-4 rounded-xl text-[15px] font-medium outline-none transition-all border-[1.5px]';
  const inputIdle  = 'bg-[#f8f9fa] dark:bg-[#1a1a1a] border-[#e5e7eb] dark:border-[#333] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555]';
  const inputFocus = 'focus:bg-white dark:focus:bg-[#222] focus:border-tint';

  // ── Form JSX (shared between mobile and desktop) ───────────────────────────
  const formContent = (
    <>
      {/* Back button */}
      <motion.button
        onClick={() => setMode('splash')}
        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center mb-8"
        whileTap={{ scale: 0.93 }}
      >
        <ChevronLeft size={20} className="text-gray-600 dark:text-[#aaa]" />
      </motion.button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white mb-1.5"
            style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.8px', lineHeight: 1.2 }}>
          Welcome back
        </h1>
        <p className="text-[14px] text-gray-400 font-medium leading-snug">
          Sign in to continue your progress.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Email */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
          <div className="relative">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
              onBlur={handleEmailBlur}
              className={`${inputBase} ${inputFocus} pr-11 ${emailError ? 'bg-red-50 border-red-400 text-gray-900' : inputIdle}`}
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
          {emailError && <p className="mt-1.5 text-[12px] text-red-500 font-medium">{emailError}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputBase} ${inputIdle} ${inputFocus} pr-11`}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 p-0.5" tabIndex={-1}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <button type="button" onClick={() => setMode('forgot-password')}
                  className="mt-2 text-[12px] text-tint font-semibold">
            Forgot password?
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-gray-100 dark:bg-[#333]" />
          <span className="text-[12px] text-gray-400 font-medium">or sign in with</span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-[#333]" />
        </div>

        {/* Google */}
        <motion.button
          type="button" onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-2.5 py-[14px] rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-white font-semibold text-[15px]"
          whileTap={{ scale: 0.97 }}>
          <GoogleLogo />
          Continue with Google
        </motion.button>

        {/* Submit */}
        <motion.button
          type="submit" disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-[17px] rounded-2xl font-black text-[16px] text-white transition-opacity"
          style={{ backgroundColor: canSubmit ? '#10B981' : '#d1d5db' }}
          whileTap={canSubmit ? { scale: 0.97 } : {}}>
          {loading ? (<><span className="si-spinner" />Signing in…</>) : 'Sign in'}
        </motion.button>

        {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 4 }}>{error}</p>}
      </form>

      {/* Footer */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <p className="text-[14px] text-gray-500">
          Don't have an account?{' '}
          <button onClick={() => setMode('signup')} className="text-tint font-semibold">Create one</button>
        </p>
      </div>
    </>
  );

  return (
    <>
      <style>{AUTOFILL_STYLE + SPINNER_STYLE}</style>

      {isDesktop ? (
        /* Desktop: centered card on light/dark page bg */
        <div className="min-h-dvh bg-[#f8f9fa] dark:bg-[#0a0a0a] flex items-center justify-center p-8">
          <motion.div
            className="w-full bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#1a1a1a]"
            style={{ maxWidth: 480, padding: '48px' }}
            variants={slideIn} initial="initial" animate="animate" exit="exit"
          >
            {formContent}
          </motion.div>
        </div>
      ) : (
        /* Mobile: full screen */
        <motion.div
          className="min-h-screen bg-white dark:bg-[#0a0a0a] overflow-y-auto"
          variants={slideIn} initial="initial" animate="animate" exit="exit"
          style={{ maxWidth: 390, margin: '0 auto', padding: '52px 24px 32px' }}
        >
          {formContent}
        </motion.div>
      )}
    </>
  );
}
