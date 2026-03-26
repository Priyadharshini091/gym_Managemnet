import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Dumbbell, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

const initialForm = {
  email: 'owner@gymflow.com',
  password: 'demo123',
};
const apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin;

export default function LoginPage() {
  const [form, setForm] = useState(initialForm);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/api/auth/login', payload);
      return data;
    },
    onSuccess: (data) => {
      setSession(data);
      const destination =
        data.user.role === 'owner'
          ? '/dashboard'
          : data.user.role === 'trainer'
            ? '/trainer-portal'
            : '/member-portal';
      navigate(destination, { replace: true });
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}`);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail
        ? error.response.data.detail
        : error.message === 'Network Error'
          ? `Failed to reach the server. Check the backend URL or CORS settings for ${apiBaseUrl}`
          : 'Login failed. Please try again.';
      toast.error(errorMessage);
    },
  });

  const submit = (event) => {
    event.preventDefault();
    loginMutation.mutate(form);
  };

  const useDemo = (email) => {
    const nextForm = { email, password: 'demo123' };
    setForm(nextForm);
    loginMutation.mutate(nextForm);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.22),transparent_28rem),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_24rem)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-accent text-slate-950">
                <Dumbbell size={24} />
              </div>
              <div className="min-w-0">
                <p className="font-display text-3xl font-bold">GymFlow</p>
                <p className="text-slate-300">FitZone Premium Gym control center</p>
              </div>
            </div>

            <div className="max-w-xl space-y-7 py-10 sm:py-14">
              <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-sm font-semibold text-yellow-200">
                <Sparkles size={16} />
                Busy-gym demo seeded with live-like data
              </span>
              <div className="space-y-4">
                <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  Run classes, members, payments, and AI help from one calm dashboard.
                </h1>
                <p className="max-w-lg text-base text-slate-300 sm:text-lg">
                  GymFlow gives owners a live operations cockpit and gives members a polished booking experience with reminders and AI assistance.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <ShieldCheck className="mb-3 text-yellow-300" />
                  <p className="font-semibold">JWT auth</p>
                  <p className="mt-1 text-sm text-slate-400">Owner and member views with guarded routes.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <Dumbbell className="mb-3 text-yellow-300" />
                  <p className="font-semibold">Class booking</p>
                  <p className="mt-1 text-sm text-slate-400">Capacity-aware weekly calendar and reminders.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:col-span-2 xl:col-span-1">
                  <Sparkles className="mb-3 text-yellow-300" />
                  <p className="font-semibold">GymFlow AI</p>
                  <p className="mt-1 text-sm text-slate-400">Database-backed chat for plans, bookings, and payments.</p>
                </div>
              </div>
            </div>

            <div className="text-sm text-slate-400">
              Owner demo: <span className="text-white">owner@gymflow.com / demo123</span>
              <br />
              Member demo: <span className="text-white">member@gymflow.com / demo123</span>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-950/30 sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Access GymFlow</p>
              <h2 className="mt-3 font-display text-3xl font-bold">Sign in</h2>
              <p className="mt-2 text-slate-500">Use the seeded owner or member account, or register through the API later.</p>
            </div>

            <form className="space-y-4" onSubmit={submit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-400 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-400 focus:bg-white"
                />
              </label>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => useDemo('owner@gymflow.com')}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <p className="font-semibold">Owner Demo</p>
                <p className="mt-1 text-sm text-slate-500">Analytics, members, payments</p>
              </button>
              <button
                type="button"
                onClick={() => useDemo('member@gymflow.com')}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <p className="font-semibold">Member Demo</p>
                <p className="mt-1 text-sm text-slate-500">Portal, bookings, AI assistant</p>
              </button>
              <button
                type="button"
                onClick={() => useDemo('trainer@gymflow.com')}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <p className="font-semibold">Trainer Demo</p>
                <p className="mt-1 text-sm text-slate-500">Manage schedule and attendee list</p>
              </button>
            </div>

            <div className="mt-4 text-center text-sm text-slate-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-semibold text-slate-900 underline"
              >
                Register here
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
