import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Dumbbell } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';

const initialForm = {
  email: '',
  password: '',
  name: '',
  phone: '',
};

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();

  const registerMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/api/auth/register', payload);
      return data;
    },
    onSuccess: (data) => {
      setSession(data);
      toast.success(`Welcome ${data.user.name.split(' ')[0]}, account created`);
      const destination =
        data.user.role === 'owner' ? '/dashboard' : data.user.role === 'trainer' ? '/trainer-portal' : '/member-portal';
      navigate(destination, { replace: true });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Registration failed');
    },
  });

  const submit = (event) => {
    event.preventDefault();
    if (!form.email || !form.password || !form.name) {
      toast.error('Please fill in required fields');
      return;
    }
    registerMutation.mutate({
      email: form.email,
      password: form.password,
      name: form.name,
      phone: form.phone || null,
      plan_type: 'basic',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.22),transparent_28rem),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_24rem)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-accent text-slate-950">
                  <Dumbbell size={24} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-3xl font-bold">GymFlow</p>
                  <p className="text-slate-300">FitZone Premium Gym control center</p>
                </div>
              </div>
              <div className="max-w-xl py-10 sm:py-14">
                <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  Create your fitness portal account
                </h1>
                <p className="mt-4 text-base text-slate-300 sm:text-lg">
                  Register for member access and start booking classes right away.
                </p>
              </div>
            </div>
            <div className="text-sm text-slate-400">
              Demo hints: use owner, member, or trainer logins from the login page once you're registered.
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-2xl shadow-slate-950/30 sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Get started</p>
              <h2 className="mt-3 font-display text-3xl font-bold">Register</h2>
              <p className="mt-2 text-slate-500">Fill in your details to create member access.</p>
            </div>

            <form className="space-y-4" onSubmit={submit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-400 focus:bg-white"
                />
              </label>

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
                  minLength={6}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-600">Phone (optional)</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-400 focus:bg-white"
                />
              </label>

              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {registerMutation.isPending ? 'Registering...' : 'Create account'}
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              <span>Already have an account?</span>{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-semibold text-slate-800 underline"
              >
                Login now
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
