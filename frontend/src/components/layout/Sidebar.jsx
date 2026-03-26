import { Dumbbell, LogOut, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function Sidebar({ navItems, mobileOpen, onClose, user }) {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const content = (
    <div className="flex h-full min-h-0 flex-col bg-sidebar px-4 py-5 text-slate-100 sm:px-5 sm:py-6">
      <div className="mb-8 flex items-start justify-between gap-3 sm:mb-10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-slate-900 shadow-lg shadow-yellow-400/25">
            <Dumbbell size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold">GymFlow</p>
            <p className="truncate text-sm text-slate-400">FitZone Premium Gym</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-white/10 text-white shadow-lg shadow-slate-950/20'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Signed in</p>
        <p className="mt-2 text-base font-semibold text-white">{user?.name}</p>
        <p className="break-all text-sm text-slate-400">{user?.email}</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-72 overflow-hidden border-r border-white/5 lg:block">
        {content}
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 transition lg:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-2 left-2 z-50 h-[calc(100%-1rem)] w-[min(20rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] transform overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl transition-transform lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  );
}
