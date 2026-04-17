import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import { GuestNudgeBanner } from './GuestNudgeBanner';

type LayoutProps = {
  showGuestNudge?: boolean;
};

export default function Layout({ showGuestNudge = false }: LayoutProps) {
  const { pathname } = useLocation();
  const showNav = !pathname.includes('/workout/current');
  const isHome  = pathname === '/';

  return (
    <div className="bg-[#f8f9fa] dark:bg-[#0a0a0a] min-h-screen text-gray-900 dark:text-white">
      <div className={`max-w-[390px] mx-auto min-h-screen ${showNav ? 'pb-24' : ''}`}>
        {/* GuestNudgeBanner: renders compact strip when on home + manages sheet globally */}
        {showGuestNudge && <GuestNudgeBanner showBanner={isHome} />}
        <Outlet />
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}
