import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import SideNav from './SideNav';
import { GuestNudgeBanner } from './GuestNudgeBanner';
import { useMediaQuery } from '@/hooks/useMediaQuery';

type LayoutProps = {
  showGuestNudge?: boolean;
};

export default function Layout({ showGuestNudge = false }: LayoutProps) {
  const { pathname } = useLocation();
  const showNav   = !pathname.includes('/workout/current');
  const isHome    = pathname === '/';
  const isTablet  = useMediaQuery('(min-width: 640px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // ── Mobile (< 640px): unchanged — max-width container + bottom nav ──────────
  if (!isTablet) {
    return (
      <div className="bg-[#f8f9fa] dark:bg-[#0a0a0a] min-h-dvh text-gray-900 dark:text-white">
        <div
          className={`w-full mx-auto min-h-dvh relative ${showNav ? 'pb-24' : ''}`}
          style={{ maxWidth: 'min(430px, 100vw)' }}
        >
          {showGuestNudge && <GuestNudgeBanner showBanner={isHome} />}
          <Outlet />
        </div>
        {showNav && <BottomNav />}
      </div>
    );
  }

  // ── Tablet / Desktop (≥ 640px): sidebar nav + full-width content ────────────
  const sidebarWidth = isDesktop ? 260 : 72;

  return (
    <div className="bg-[#f8f9fa] dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
      {showNav && <SideNav isDesktop={isDesktop} />}
      {/*
        height: 100dvh + overflow-y: auto makes <main> the scroll container.
        The sidebar is position:fixed so it never scrolls with the content.
        Screens inside only need min-height: 100% — they don't manage scroll.
      */}
      <main
        style={{
          marginLeft: showNav ? sidebarWidth : 0,
          height: '100dvh',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          transition: 'margin-left 0.25s ease',
        }}
      >
        {showGuestNudge && <GuestNudgeBanner showBanner={isHome} />}
        <Outlet />
      </main>
    </div>
  );
}
