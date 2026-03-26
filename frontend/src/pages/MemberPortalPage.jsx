import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, LogOut, Sparkles, TimerReset } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import {
  classTypeStyles,
  countdownLabel,
  formatCurrency,
  formatDate,
  formatTime,
  startOfWeek,
  statusBadge,
  toDateInputValue,
} from '../lib/format';
import { useAuthStore } from '../store/authStore';

function heatCellTone(value) {
  if (value >= 3) return 'bg-yellow-400';
  if (value === 2) return 'bg-yellow-300';
  if (value === 1) return 'bg-yellow-200';
  return 'bg-slate-100';
}

function buildHeatmap(bookings) {
  const lookup = bookings.reduce((accumulator, booking) => {
    if (booking.status === 'cancelled') {
      return accumulator;
    }
    const key = booking.booked_at.slice(0, 10);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  return Array.from({ length: 30 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (29 - index));
    const key = toDateInputValue(day);
    return {
      key,
      count: lookup[key] || 0,
      label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });
}

export default function MemberPortalPage() {
  const user = useAuthStore((state) => state.user);
  const member = useAuthStore((state) => state.member);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const currentWeek = toDateInputValue(startOfWeek(new Date()));
  const nextWeekDate = new Date(startOfWeek(new Date()));
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextWeek = toDateInputValue(nextWeekDate);

  const bookingsQuery = useQuery({
    queryKey: ['portal-bookings'],
    queryFn: async () => {
      const { data } = await api.get('/api/bookings/my');
      return data;
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ['member-payments'],
    queryFn: async () => {
      const { data } = await api.get('/api/payments');
      return data;
    },
  });

  const classesQuery = useQuery({
    queryKey: ['portal-classes', currentWeek, nextWeek],
    queryFn: async () => {
      const [current, upcoming] = await Promise.all([
        api.get('/api/classes', { params: { week: currentWeek } }),
        api.get('/api/classes', { params: { week: nextWeek } }),
      ]);
      return [...current.data, ...upcoming.data];
    },
  });

  const payMutation = useMutation({
    mutationFn: async (paymentId) => {
      const { data } = await api.post(`/api/payments/${paymentId}/pay`);
      return data;
    },
    onSuccess: () => {
      toast.success('Payment successful!');
      queryClient.invalidateQueries({ queryKey: ['member-payments'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Payment failed');
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/api/bookings', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Booked! Your reminder is queued.');
      queryClient.invalidateQueries({ queryKey: ['portal-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['portal-classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['member-payments'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Could not book that class');
    },
  });

  const upcomingBookings = (bookingsQuery.data || [])
    .filter((booking) => booking.status === 'confirmed' && new Date(booking.booked_at) >= new Date())
    .sort((left, right) => new Date(left.booked_at) - new Date(right.booked_at));

  const quickBookClasses = (classesQuery.data || [])
    .filter((session) => new Date(session.start_at) >= new Date())
    .sort((left, right) => new Date(left.start_at) - new Date(right.start_at))
    .slice(0, 4);

  const heatmap = buildHeatmap(bookingsQuery.data || []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (bookingsQuery.isLoading || classesQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.2),transparent_24rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4 sm:p-6 lg:p-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <LoadingSkeleton className="h-20 w-full" />
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <LoadingSkeleton className="h-96 w-full" />
            <LoadingSkeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.18),transparent_24rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="panel flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Member Portal</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Your {member?.plan_type} plan is active, and your next classes, quick booking options, and attendance rhythm are all here.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/classes')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <CalendarDays size={18} />
              Full schedule
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-900"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="panel p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-yellow-100 p-3 text-yellow-600">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Upcoming</p>
                  <h2 className="font-display text-2xl font-bold text-slate-900">Your next bookings</h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {upcomingBookings.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
                    No upcoming bookings yet. Pick a class below and we'll get you back on the calendar.
                  </div>
                ) : (
                  upcomingBookings.map((booking) => (
                    <div key={booking.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-bold text-slate-900">{booking.class_name}</p>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge(booking.status)}`}>
                              {booking.status}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {formatDate(booking.booked_at, { weekday: 'long', month: 'long', day: 'numeric' })} / {formatTime(booking.booked_at)} / {booking.trainer}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                          {countdownLabel(booking.booked_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-900 p-3 text-white">
                  <TimerReset size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Consistency</p>
                  <h2 className="font-display text-2xl font-bold text-slate-900">Attendance heatmap</h2>
                </div>
              </div>
              <div className="mt-6">
                <div className="grid grid-flow-col auto-cols-max grid-rows-7 gap-1.5">
                  {heatmap.map((day) => (
                    <div
                      key={day.key}
                      title={`${day.label}: ${day.count} classes`}
                      className={`h-6 w-6 rounded-lg sm:h-7 sm:w-7 ${heatCellTone(day.count)}`}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>Last 30 days</span>
                <span>{heatmap.reduce((total, item) => total + item.count, 0)} attended or booked classes</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="panel p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Membership</p>
              <div className="mt-4 flex flex-col gap-4 rounded-3xl bg-slate-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <p className="text-sm text-slate-400">Current plan</p>
                  <p className="mt-2 font-display text-3xl font-bold capitalize">{member?.plan_type}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Joined {formatDate(member?.join_date, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className={`inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase ${statusBadge(member?.status)}`}>
                  {member?.status?.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="panel p-5 sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Payments</p>
              <div className="mt-4 space-y-3">
                {(paymentsQuery.data || []).filter((payment) => payment.status !== 'paid').length === 0 ? (
                  <p className="text-sm text-slate-500">All invoices are paid and current.</p>
                ) : (
                  (paymentsQuery.data || [])
                    .filter((payment) => payment.status !== 'paid')
                    .map((payment) => (
                      <div key={payment.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-slate-500">
                            Due {formatDate(payment.due_date)} / {payment.status}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => payMutation.mutate(payment.id)}
                          disabled={payMutation.isPending}
                          className="rounded-lg bg-yellow-400 px-3 py-2 text-xs font-bold text-slate-900 hover:bg-yellow-300 disabled:opacity-50"
                        >
                          Pay now
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="panel p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Quick Book</p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-slate-900">Closest available classes</h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {quickBookClasses.map((session) => (
                  <div key={`${session.id}-${session.start_at}`} className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${classTypeStyles(session.class_type)}`}>
                          {session.class_type}
                        </span>
                        <p className="mt-3 text-lg font-bold text-slate-900">{session.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(session.start_at, { weekday: 'short', month: 'short', day: 'numeric' })} / {formatTime(session.start_at)} / {session.trainer}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          bookingMutation.mutate({
                            class_id: session.id,
                            scheduled_for: session.start_at,
                            member_id: member.id,
                          })
                        }
                        disabled={bookingMutation.isPending || session.spots_left === 0}
                        className="rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-yellow-300 disabled:opacity-50"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
