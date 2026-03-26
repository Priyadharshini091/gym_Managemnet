import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/testimonials', label: 'Testimonials' },
  { to: '/products', label: 'Products' },
  { to: '/pay-online', label: 'Pay Online' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function MarketingLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.18),transparent_24rem),radial-gradient(circle_at_right_center,rgba(15,23,42,0.06),transparent_28rem),linear-gradient(180deg,#fffdf5_0%,#ffffff_45%,#f8fafc_100%)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
              GF
            </div>
            <div>
              <p className="font-display text-xl font-bold">GymFlow</p>
              <p className="text-sm text-slate-500">FitZone Premium Gym</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-semibold transition ${isActive ? 'text-slate-950' : 'text-slate-500 hover:text-slate-900'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {token ? (
              <>
                <Link
                  to="/portal"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {user?.role === 'member' ? 'My Portal' : 'Dashboard'}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  Join Now
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 lg:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {mobileOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="mt-4 grid gap-3">
              {token ? (
                <>
                  <Link
                    to="/portal"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700"
                  >
                    {user?.role === 'member' ? 'My Portal' : 'Dashboard'}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Join Now
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr_0.8fr] lg:px-8">
          <div>
            <p className="font-display text-3xl font-bold">GymFlow</p>
            <p className="mt-3 max-w-md text-sm text-slate-300">
              Premium training, easier bookings, fast online payments, and a cleaner member experience.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Explore</p>
            <div className="mt-4 grid gap-2">
              {NAV_ITEMS.map((item) => (
                <Link key={item.to} to={item.to} className="text-sm text-slate-300 transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Visit</p>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p>FitZone Premium Gym</p>
              <p>6 AM - 10 PM every day</p>
              <p>support@gymflow.com</p>
              <p>+1 555-0100</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
