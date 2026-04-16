import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Activity, Plus, BarChart2, User } from 'lucide-react';
import useStore from '@/store';

export default function BottomNav() {
  const navigate    = useNavigate();
  const { pathname } = useLocation();
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
    icon,
    label,
    active,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 flex-1 py-2"
    >
      <span className={active ? 'text-tint' : 'text-gray-400'}>{icon}</span>
      <span className={`text-[10px] font-medium ${active ? 'text-tint' : 'text-gray-400'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30">
      <div className="max-w-[390px] mx-auto bg-white border-t border-gray-100 flex items-center px-2 pb-safe">
        <Item icon={<Home size={22} />}     label="Home"    active={isHome}    onClick={() => navigate('/')} />
        <Item icon={<Activity size={22} />} label="History" active={isHistory} onClick={() => navigate('/history')} />

        {/* Centre FAB */}
        <div className="flex flex-col items-center flex-1">
          <button
            onClick={handleFAB}
            className="w-[52px] h-[52px] rounded-full bg-tint flex items-center justify-center shadow-[0_4px_14px_rgba(16,185,129,0.4)] active:scale-95 transition-transform -mt-5"
          >
            <Plus size={24} className="text-white" />
          </button>
        </div>

        <Item icon={<BarChart2 size={22} />} label="Stats"   active={isStats} onClick={() => navigate('/stats')} />
        <Item icon={<User size={22} />}      label="Profile" active={isProfile} onClick={() => navigate('/profile')} />
      </div>
    </nav>
  );
}
