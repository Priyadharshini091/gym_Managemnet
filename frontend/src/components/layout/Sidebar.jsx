import { NavLink } from 'react-router-dom';

export default function Sidebar({ navItems, mobileOpen, onClose, user }) {
  const content = (
    <div className="flex h-full flex-col bg-sidebar px-5 py-6 text-slate-100">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-xl text-slate-900 shadow-lg shadow-yellow-400/25">
          🏋️
        </div>
        <div>
          <p className="font-display text-xl font-bold">GymFlow</p>
          <p className="text-sm text-slate-400">FitZone Premium Gym</p>
        </div>
      </div>

      <nav className="space-y-2">
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

      <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Signed in</p>
        <p className="mt-2 text-base font-semibold text-white">{user?.name}</p>
        <p className="text-sm text-slate-400">{user?.email}</p>
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
        className={`fixed inset-y-0 left-0 z-50 w-72 transform overflow-hidden border-r border-white/5 transition-transform lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  );
}
