import { Dumbbell, LayoutDashboard, Menu, Users, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthStore } from '../../store/authStore';

const OWNER_NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/classes', label: 'Classes', icon: Dumbbell },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/trainer-portal', label: 'Trainer Portal', icon: Dumbbell },
];

const TRAINER_NAV = [
  { to: '/trainer-portal', label: 'Trainer Portal', icon: Dumbbell },
  { to: '/classes', label: 'Classes', icon: Dumbbell },
];

const MEMBER_NAV = [{ to: '/classes', label: 'Classes', icon: Dumbbell }];

const TITLES = {
  '/dashboard': 'Owner Dashboard',
  '/classes': 'Booking Calendar',
  '/members': 'Member Intelligence',
  '/payments': 'Payments Hub',
};

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const navItems =
    user?.role === 'owner'
      ? OWNER_NAV
      : user?.role === 'trainer'
      ? TRAINER_NAV
      : MEMBER_NAV;

  return (
    <div className="min-h-screen">
      <Sidebar
        navItems={navItems}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
      />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 lg:hidden"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">GymFlow</p>
                <h1 className="font-display text-2xl font-bold text-slate-900">
                  {TITLES[location.pathname] || 'GymFlow'}
                </h1>
              </div>
            </div>

            <div className="hidden rounded-full border border-yellow-300/60 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700 sm:block">
              Live demo data
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
