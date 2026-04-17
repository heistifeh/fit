import { useState, useRef } from 'react';
import { ChevronLeft, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/context/AuthContext';
import { SPRING } from '@/animations/fitnex.variants';

// ─── Autofill override ────────────────────────────────────────────────────────

const AUTOFILL_STYLE = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 30px #f8f9fa inset !important;
    -webkit-text-fill-color: #111 !important;
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
  const { setMode, signUp } = useAuthContext();

  const [name,         setName]         = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError,   setEmailError]   = useState('');
  const [loading,      setLoading]      = useState(false);

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
    try {
      await signUp(name.trim(), email, password);
    } finally {
      setLoading(false);
    }
  };

  const inputBase = 'w-full py-[14px] px-4 rounded-xl text-[15px] font-medium outline-none transition-all border-[1.5px]';
  const inputIdle = 'bg-[#f8f9fa] border-[#e5e7eb] text-gray-900 placeholder:text-gray-400';
  const inputFocus = 'focus:bg-white focus:border-tint';

  return (
    <>
      <style>{AUTOFILL_STYLE + SPINNER_STYLE}</style>

      <motion.div
        className="min-h-screen bg-white overflow-y-auto"
        variants={slideIn}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ maxWidth: 390, margin: '0 auto', padding: '52px 24px 32px' }}
      >
        {/* ── Back button ──────────────────────────────────────────────── */}
        <motion.button
          onClick={() => setMode('splash')}
          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-8"
          whileTap={{ scale: 0.93 }}
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </motion.button>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1
            className="text-gray-900 mb-1.5"
            style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.8px', lineHeight: 1.2 }}
          >
            Create account
          </h1>
          <p className="text-[14px] text-gray-400 font-medium leading-snug">
            Join thousands of lifters tracking their progress on Fitnex.
          </p>
        </div>

        {/* ── Form ─────────────────────────────────────────────────────── */}
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
              {/* Status icon */}
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
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[12px] text-gray-400 font-medium">or sign up with</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Google button */}
          <motion.button
            type="button"
            onClick={() => console.log('TODO: Google OAuth')}
            className="w-full flex items-center justify-center gap-2.5 py-[14px] rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-[15px]"
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

        </form>

        {/* ── Footer ───────────────────────────────────────────────────── */}
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
            <a href="#" className="underline" style={{ textUnderlineOffset: 3 }}>Terms</a>
            {' '}and{' '}
            <a href="#" className="underline" style={{ textUnderlineOffset: 3 }}>Privacy Policy</a>
          </p>
        </div>

      </motion.div>
    </>
  );
}
