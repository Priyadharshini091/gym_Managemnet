import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Modal from '../components/ui/Modal';
import { classTypeStyles, formatDate, formatTime, initials, startOfWeek, toDateInputValue } from '../lib/format';
import { useAuthStore } from '../store/authStore';

const START_HOUR = 5;
const END_HOUR = 22;
const TIME_SLOTS = Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, index) => START_HOUR * 60 + index * 30);

function getWeekDays(weekStartValue) {
  const base = new Date(weekStartValue);
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(base);
    next.setDate(base.getDate() + index);
    return next;
  });
}

function getGridPlacement(session) {
  const start = new Date(session.start_at);
  const end = new Date(session.end_at);
  const dayIndex = (new Date(`${session.scheduled_date}T12:00:00`).getDay() + 6) % 7;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const duration = Math.max((end.getTime() - start.getTime()) / 60000, 45);
  const rowStart = Math.floor((startMinutes - START_HOUR * 60) / 30) + 2;
  const span = Math.max(Math.round(duration / 30), 2);
  return {
    gridColumn: dayIndex + 2,
    gridRow: `${rowStart} / span ${span}`,
  };
}

function DayColumn({ day, sessions, onSelect }) {
  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            {day.toLocaleDateString('en-US', { weekday: 'short' })}
          </p>
          <p className="font-display text-xl font-bold text-slate-900">
            {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
          {sessions.length} classes
        </span>
      </div>
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No classes scheduled for this day.
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={`${session.id}-${session.start_at}`}
              type="button"
              onClick={() => onSelect(session)}
              className={`w-full rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${classTypeStyles(session.class_type)}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{session.name}</p>
                  <p className="mt-1 text-sm opacity-80">
                    {formatTime(session.start_at)} / {session.trainer}
                  </p>
                </div>
                <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">
                  {session.spots_left} left
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function ClassesPage() {
  const [weekStart, setWeekStart] = useState(() => toDateInputValue(startOfWeek(new Date())));
  const [selectedClass, setSelectedClass] = useState(null);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const member = useAuthStore((state) => state.member);
  const weekDays = getWeekDays(weekStart);

  const classesQuery = useQuery({
    queryKey: ['classes', weekStart],
    queryFn: async () => {
      const { data } = await api.get('/api/classes', { params: { week: weekStart } });
      return data;
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/api/bookings', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Booked! Reminder will be sent 1 hour before.');
      setSelectedClass(null);
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['portal-bookings'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Could not book that class');
    },
  });

  const shiftWeek = (direction) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + direction * 7);
    setWeekStart(toDateInputValue(next));
  };

  const handleBook = () => {
    if (!selectedClass || !member) {
      return;
    }
    bookingMutation.mutate({
      class_id: selectedClass.id,
      scheduled_for: selectedClass.start_at,
      member_id: member.id,
    });
  };

  if (classesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <LoadingSkeleton className="h-10 w-56" />
          <LoadingSkeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="panel p-4">
              <LoadingSkeleton className="h-6 w-28" />
              <LoadingSkeleton className="mt-5 h-48 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sessions = classesQuery.data || [];

  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Schedule</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
              {formatDate(weekDays[0], { month: 'long', day: 'numeric' })} - {formatDate(weekDays[6], { month: 'long', day: 'numeric' })}
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => shiftWeek(-1)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <ChevronLeft size={18} />
              Prev
            </button>
            <input
              type="date"
              value={weekStart}
              onChange={(event) => setWeekStart(toDateInputValue(startOfWeek(new Date(event.target.value))))}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-yellow-400"
            />
            <button
              type="button"
              onClick={() => shiftWeek(1)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="panel hidden overflow-hidden xl:block">
          <div className="overflow-x-auto scrollbar-thin">
            <div
              className="grid min-w-[980px] bg-white"
              style={{
                gridTemplateColumns: '82px repeat(7, minmax(0, 1fr))',
                gridTemplateRows: `72px repeat(${TIME_SLOTS.length}, 38px)`,
              }}
            >
              <div className="border-b border-r border-slate-200 bg-slate-50" />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="border-b border-r border-slate-200 bg-slate-50 px-4 py-3 last:border-r-0"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-slate-900">
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}

              {TIME_SLOTS.map((slot, index) => {
                const hours = Math.floor(slot / 60);
                const minutes = slot % 60;
                const label = minutes === 0 ? new Date(2025, 0, 1, hours, minutes).toLocaleTimeString('en-US', { hour: 'numeric' }) : '';
                return (
                  <div key={slot} className="contents">
                    <div className="border-r border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400">
                      {label}
                    </div>
                    {Array.from({ length: 7 }).map((_, dayIndex) => (
                      <div
                        key={`${slot}-${dayIndex}`}
                        className="border-r border-t border-slate-100 bg-white/70 last:border-r-0"
                        style={{ gridColumn: dayIndex + 2, gridRow: index + 2 }}
                      />
                    ))}
                  </div>
                );
              })}

              {sessions.map((session) => (
                <button
                  key={`${session.id}-${session.start_at}`}
                  type="button"
                  onClick={() => setSelectedClass(session)}
                  style={getGridPlacement(session)}
                  className={`mx-1 my-1 flex flex-col justify-between rounded-3xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 ${classTypeStyles(session.class_type)}`}
                >
                  <div>
                    <p className="text-sm font-bold">{session.name}</p>
                    <p className="mt-1 text-xs opacity-80">{session.trainer}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                    <span>{formatTime(session.start_at)}</span>
                    <span>{session.spots_left} left</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:hidden">
          {weekDays.map((day) => {
            const dayKey = toDateInputValue(day);
            const daySessions = sessions.filter((session) => session.scheduled_date === dayKey);
            return <DayColumn key={dayKey} day={day} sessions={daySessions} onSelect={setSelectedClass} />;
          })}
        </div>

        <div className="space-y-4">
          <div className="panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">How it works</p>
                <h3 className="mt-2 font-display text-2xl font-bold text-slate-900">Book by tapping any class</h3>
              </div>
              <CalendarDays className="shrink-0 text-yellow-500" />
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                Capacity is live and reflected by each class card's spots-left badge.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                Confirmed bookings trigger reminders one hour before the class.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                {user?.role === 'member'
                  ? 'Tap a class to book instantly from your member account.'
                  : 'Owner accounts can browse the schedule, while member accounts can book directly.'}
              </div>
            </div>
          </div>

          <div className="panel p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">This week</p>
            <div className="mt-4 space-y-3">
              {sessions.slice(0, 6).map((session) => (
                <button
                  key={`peek-${session.id}-${session.start_at}`}
                  type="button"
                  onClick={() => setSelectedClass(session)}
                  className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{session.name}</p>
                    <p className="text-sm text-slate-500">
                      {formatDate(session.start_at, { weekday: 'short', month: 'short', day: 'numeric' })} / {formatTime(session.start_at)}
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-xs font-bold uppercase ${classTypeStyles(session.class_type)}`}>
                    {session.class_type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Modal
        open={Boolean(selectedClass)}
        title={selectedClass?.name || 'Class details'}
        onClose={() => setSelectedClass(null)}
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setSelectedClass(null)}
              className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!member || bookingMutation.isPending || selectedClass?.spots_left === 0}
              onClick={handleBook}
              className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {member ? 'Book Now' : 'Member login required'}
            </button>
          </div>
        }
      >
        {selectedClass ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${classTypeStyles(selectedClass.class_type)}`}>
                {selectedClass.class_type}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                {selectedClass.spots_left} spots left
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <Clock3 className="text-yellow-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Schedule</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {formatDate(selectedClass.start_at, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatTime(selectedClass.start_at)} - {formatTime(selectedClass.end_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                    {initials(selectedClass.trainer)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Trainer</p>
                    <p className="mt-1 font-semibold text-slate-900">{selectedClass.trainer}</p>
                    <p className="text-sm text-slate-600">Coach-led session</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Capacity</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min((selectedClass.booked_count / selectedClass.capacity) * 100, 100)}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {selectedClass.booked_count} booked out of {selectedClass.capacity}. The remaining {selectedClass.spots_left} spots are still available.
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
