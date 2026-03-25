import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api/client';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { useAuthStore } from '../store/authStore';
import { formatDate, formatTime, statusBadge } from '../lib/format';

export default function TrainerPortalPage() {
  const user = useAuthStore((state) => state.user);

  const scheduleQuery = useQuery({
    queryKey: ['trainer-schedule'],
    queryFn: async () => {
      const { data } = await api.get('/api/trainer/schedule');
      return data;
    },
  });

  const bookingsQuery = useQuery({
    queryKey: ['trainer-bookings'],
    queryFn: async () => {
      const { data } = await api.get('/api/trainer/bookings');
      return data;
    },
  });

  if (scheduleQuery.isLoading || bookingsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-12 w-72" />
        <LoadingSkeleton className="h-72 w-full" />
      </div>
    );
  }

  const schedule = scheduleQuery.data || [];
  const bookings = bookingsQuery.data || [];

  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <h1 className="font-display text-3xl font-bold text-slate-900">Trainer Portal</h1>
        <p className="text-slate-600">{`Hello ${user?.name}, here’s your coaching dashboard.`}</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <h2 className="text-xl font-bold text-slate-900">This Week's Classes</h2>
          {schedule.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No scheduled classes found.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {schedule.map((session) => (
                <div key={`${session.id}-${session.start_at}`} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{session.name}</p>
                      <p className="text-sm text-slate-500">
                        {formatDate(session.scheduled_date, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatTime(session.start_at)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge('confirmed')}`}>Confirmed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel p-6">
          <h2 className="text-xl font-bold text-slate-900">Current Bookings</h2>
          {bookings.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No active class bookings yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {bookings.slice(0, 10).map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold text-slate-900">{booking.class_name}</p>
                    <p className="text-sm text-slate-500">Member ID: {booking.member_id}</p>
                    <p className="text-sm text-slate-500">{formatDate(booking.booked_at)} · {formatTime(booking.booked_at)}</p>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold uppercase ${statusBadge(booking.status)}`}>{booking.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="panel p-6">
        <button
          type="button"
          onClick={() => {
            toast.success('Quick actions are coming soon!');
          }}
          className="rounded-2xl bg-yellow-400 px-4 py-2 font-bold text-slate-900 transition hover:bg-yellow-300"
        >
          Report attendance (coming soon)
        </button>
      </section>
    </div>
  );
}
