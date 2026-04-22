import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Activity, BarChart2, User, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/context/AuthContext';
import useStore from '@/store';
import { press } from '@/animations/fitnex.variants';

type SideNavProps = {
  isDesktop: boolean;
};

export default function SideNav({ isDesktop }: SideNavProps) {
  const navigate        = useNavigate();
  const { pathname }    = useLocation();
  const { profile, mode } = useAuthContext();
  const currentWorkout  = useStore((s) => s.currentWorkout);
  const startWorkout    = useStore((s) => s.startWorkout);

  const navItems = [
    { icon: Home,      label: 'Home',    path: '/',        active: pathname === '/' },
    { icon: Activity,  label: 'History', path: '/history', active: pathname === '/history' },
    { icon: BarChart2, label: 'Stats',   path: '/stats',   active: pathname === '/stats' },
    { icon: User,      label: 'Profile', path: '/profile', active: pathname === '/profile' },
  ];

  const handleFAB = () => {
    if (!currentWorkout) startWorkout();
    navigate('/workout/current');
  };

  const width = isDesktop ? 260 : 72;

  return (
    <div
      className="bg-white dark:bg-[#0a0a0a] border-r border-gray-100 dark:border-[#1a1a1a] flex flex-col"
      style={{
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        width,
        padding: isDesktop ? '32px 16px' : '32px 10px',
        zIndex: 100,
        transition: 'width 0.25s ease',
        overflow: 'hidden',
      }}
    >
      {/* ── Brand ──────────────────────────────────────────────────────────── */}
      <div
        className={`flex items-center gap-2.5 mb-10 ${isDesktop ? 'pl-2' : 'justify-center'}`}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-tint flex-shrink-0" />
        {isDesktop && (
          <span className="text-[15px] font-black text-gray-900 dark:text-white tracking-widest">
            FITNEX
          </span>
        )}
      </div>

      {/* ── Nav items ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 mb-2">
        {navItems.map((item) => (
          <motion.button
            key={item.label}
            onClick={() => navigate(item.path)}
            whileTap={press.whileTap}
            className={`flex items-center rounded-xl border-none cursor-pointer w-full transition-colors ${
              isDesktop ? 'gap-3 px-3.5 py-2.5 justify-start' : 'justify-center px-0 py-2.5'
            } ${
              item.active
                ? 'bg-[#f0fdf4] dark:bg-[#0d2e22] text-tint'
                : 'bg-transparent text-gray-500 dark:text-[#555] hover:bg-gray-50 dark:hover:bg-[#111]'
            }`}
          >
            <item.icon size={20} />
            {isDesktop && (
              <span className={`text-[14px] ${item.active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* ── Start workout button ────────────────────────────────────────────── */}
      <motion.button
        onClick={handleFAB}
        whileTap={press.whileTap}
        className={`flex items-center rounded-xl border-none bg-tint text-white cursor-pointer w-full ${
          isDesktop ? 'gap-3 px-3.5 py-3 justify-start' : 'justify-center px-0 py-3'
        }`}
        style={{ boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}
      >
        <Plus size={20} />
        {isDesktop && <span className="text-[14px] font-bold">Start workout</span>}
      </motion.button>

      {/* ── Spacer ─────────────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Profile shortcut (desktop only) ────────────────────────────────── */}
      {isDesktop && mode !== 'guest' && (
        <motion.button
          onClick={() => navigate('/profile')}
          whileTap={press.whileTap}
          className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl border-none bg-transparent cursor-pointer w-full hover:bg-gray-50 dark:hover:bg-[#111] transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-full bg-tint flex items-center justify-center text-white font-black text-sm flex-shrink-0">
            {(profile?.name?.[0] ?? 'U').toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-[13px] font-bold text-gray-900 dark:text-white m-0 truncate">
              {profile?.name ?? 'You'}
            </p>
            <p className="text-[12px] text-gray-400 m-0">View profile</p>
          </div>
        </motion.button>
      )}
    </div>
  );
}
