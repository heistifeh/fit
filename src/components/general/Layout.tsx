import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import { GuestCompactBanner } from './GuestNudgeBanner';

type LayoutProps = {
  showGuestNudge?: boolean;
};

export default function Layout({ showGuestNudge = false }: LayoutProps) {
  const { pathname } = useLocation();
  const showNav = !pathname.includes('/workout/current');
  const isHome  = pathname === '/';

  return (
    <div className="bg-[#f8f9fa] min-h-screen text-gray-900">
      <div className={`max-w-[390px] mx-auto min-h-screen ${showNav ? 'pb-24' : ''}`}>
        {/* Guest compact banner — only on home screen */}
        {showGuestNudge && isHome && <GuestCompactBanner />}
        <Outlet />
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}
