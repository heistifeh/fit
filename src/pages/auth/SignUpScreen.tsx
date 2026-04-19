import { useState, useRef } from 'react';
import { ChevronLeft, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { SPRING } from '@/animations/fitnex.variants';

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
  @keyframes su-spin { to { transform: rotate(360deg); } }
  .su-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: su-spin 0.7s linear infinite;
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
  0: { label: '',           color: '#e5e7eb', bars: 0 },
  1: { label: 'Weak',       color: '#ef4444', bars: 1 },
  2: { label: 'Fair',       color: '#f59e0b', bars: 2 },
  3: { label: 'Strong',     color: '#10B981', bars: 3 },
  4: { label: 'Very strong',color: '#10B981', bars: 4 },
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

export default function SignUpScreen() {
  const { setMode, signUp, signInWithGoogle } = useAuthContext();
  const { darkMode } = usePreferences();

  const [name,         setName]         = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError,   setEmailError]   = useState('');
  const [error,        setError]        = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [emailSent,    setEmailSent]    = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit  = name.trim() !== '' && email !== '' && emailValid && password.length >= 1 && !loading;

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
      await signUp(name.trim(), email, password);
      setEmailSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputBase = 'w-full py-[14px] px-4 rounded-xl text-[15px] font-medium outline-none transition-all border-[1.5px]';
  const inputIdle = 'bg-[#f8f9fa] dark:bg-[#1a1a1a] border-[#e5e7eb] dark:border-[#333] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555]';
  const inputFocus = 'focus:bg-white dark:focus:bg-[#222] focus:border-tint';

  return (
    <>
      <style>{AUTOFILL_STYLE + SPINNER_STYLE}</style>

      <motion.div
        className="min-h-screen bg-white dark:bg-[#0a0a0a] overflow-y-auto"
        variants={slideIn}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ maxWidth: 390, margin: '0 auto', padding: '52px 24px 32px' }}
      >
        {/* ── Back button (hidden once email is sent) ───────────────── */}
        {!emailSent && (
          <motion.button
            onClick={() => setMode('splash')}
            className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center mb-8"
            whileTap={{ scale: 0.93 }}
          >
            <ChevronLeft size={20} className="text-gray-600 dark:text-[#aaa]" />
          </motion.button>
        )}

        {emailSent ? (

          /* ── Email confirmation screen ─────────────────────────────── */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: darkMode ? '#0d2e22' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: darkMode ? '#fff' : '#111', marginBottom: 8 }}>
              Check your email
            </h2>
            <p style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>
              We sent a confirmation link to
            </p>
            <p style={{ color: darkMode ? '#e5e7eb' : '#111', fontWeight: 700, fontSize: 15, marginBottom: 32 }}>
              {email}
            </p>
            <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, marginBottom: 32, maxWidth: 260 }}>
              Click the link in the email to activate your account, then come back to sign in.
            </p>
            <button
              onClick={() => setMode('signin')}
              style={{ width: '100%', background: '#10B981', border: 'none', borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 800, color: '#fff', cursor: 'pointer' }}
            >
              Go to sign in
            </button>
            <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 16 }}>
              Didn't get it? Check your spam folder
            </p>
          </div>

        ) : (

          /* ── Sign-up form ──────────────────────────────────────────── */
          <>
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="mb-8">
              <h1
                className="text-gray-900 dark:text-white mb-1.5"
                style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.8px', lineHeight: 1.2 }}
              >
                Create account
              </h1>
              <p className="text-[14px] text-gray-400 font-medium leading-snug">
                Join thousands of lifters tracking their progress on Fitnex.
              </p>
            </div>

            {/* ── Form ───────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Full name */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Full name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tife"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${inputBase} ${inputIdle} ${inputFocus} ${name ? 'pr-11' : ''}`}
                  />
                  {name.trim() && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-tint flex items-center justify-center">
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
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
                    ref={emailRef}
                    className={`${inputBase} ${inputFocus} pr-11 ${
                      emailError
                        ? 'bg-red-50 border-red-400 text-gray-900'
                        : `${inputIdle}`
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

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gray-100 dark:bg-[#333]" />
                <span className="text-[12px] text-gray-400 font-medium">or sign up with</span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-[#333]" />
              </div>

              {/* Google */}
              <motion.button
                type="button"
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-2.5 py-[14px] rounded-xl border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-white font-semibold text-[15px]"
                whileTap={{ scale: 0.97 }}
              >
                <GoogleLogo />
                Continue with Google
              </motion.button>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={!canSubmit}
                className="w-full flex items-center justify-center gap-2 py-[17px] rounded-2xl font-black text-[16px] text-white transition-opacity"
                style={{ backgroundColor: canSubmit ? '#10B981' : '#d1d5db' }}
                whileTap={canSubmit ? { scale: 0.97 } : {}}
              >
                {loading ? (
                  <>
                    <span className="su-spinner" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </motion.button>

              {error && (
                <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                  {error}
                </p>
              )}

            </form>

            {/* ── Footer ─────────────────────────────────────────────── */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-[14px] text-gray-500">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-tint font-semibold"
                >
                  Sign in
                </button>
              </p>
              <p className="text-[12px] text-gray-400 text-center leading-relaxed">
                By signing up you agree to our{' '}
                <a href="https://fitnexonline.com/terms" target="_blank" rel="noopener noreferrer" className="underline" style={{ textUnderlineOffset: 3 }}>Terms</a>
                {' '}and{' '}
                <a href="https://fitnexonline.com/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ textUnderlineOffset: 3 }}>Privacy Policy</a>
              </p>
            </div>
          </>

        )}

      </motion.div>
    </>
  );
}
