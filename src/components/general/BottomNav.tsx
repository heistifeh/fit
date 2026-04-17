import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Activity, Plus, BarChart2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import useStore from '@/store';
import { tabActive, fabPulse, press } from '@/animations/fitnex.variants';

export default function BottomNav() {
  const navigate       = useNavigate();
  const { pathname }   = useLocation();
  const currentWorkout = useStore((state) => state.currentWorkout);
  const startWorkout   = useStore((state) => state.startWorkout);

  const isHome    = pathname === '/';
  const isHistory = pathname === '/history';
  const isStats   = pathname === '/stats';
  const isProfile = pathname === '/profile';

  const handleFAB = () => {
    if (!currentWorkout) startWorkout();
    navigate('/workout/current');
  };

  const Item = ({
    icon, label, active, onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
  }) => (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center gap-1 flex-1 py-2"
      variants={tabActive}
      animate={active ? 'active' : 'inactive'}
      initial={false}
    >
      <span>{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </motion.button>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30">
      <div className="max-w-[390px] mx-auto bg-white border-t border-gray-100 flex items-center px-2 pb-safe">
        <Item icon={<Home size={22} />}     label="Home"    active={isHome}    onClick={() => navigate('/')} />
        <Item icon={<Activity size={22} />} label="History" active={isHistory} onClick={() => navigate('/history')} />

        {/* Centre FAB */}
        <div className="flex flex-col items-center flex-1">
          <motion.button
            onClick={handleFAB}
            className="w-[52px] h-[52px] rounded-full bg-tint flex items-center justify-center -mt-5"
            animate={fabPulse.animate}
            transition={fabPulse.transition}
            whileTap={press.whileTap}
          >
            <Plus size={24} className="text-white" />
          </motion.button>
        </div>

        <Item icon={<BarChart2 size={22} />} label="Stats"   active={isStats}   onClick={() => navigate('/stats')} />
        <Item icon={<User size={22} />}      label="Profile" active={isProfile} onClick={() => navigate('/profile')} />
      </div>
    </nav>
  );
}
