import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
  const { pathname } = useLocation();
  const showNav = !pathname.includes('/workout/current');

  return (
    <div className="bg-[#f8f9fa] min-h-screen text-gray-900">
      <div className={`max-w-[390px] mx-auto min-h-screen ${showNav ? 'pb-24' : ''}`}>
        <Outlet />
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}
