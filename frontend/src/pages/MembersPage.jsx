import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone, Plus, Search, Send } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import Drawer from '../components/ui/Drawer';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import Modal from '../components/ui/Modal';
import { formatDate, formatTime, initials, statusBadge } from '../lib/format';

const emptyForm = {
  name: '',
  email: '',
  password: 'demo123',
  phone: '',
  plan_type: 'basic',
  status: 'active',
};

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const deferredSearch = useDeferredValue(search);
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ['members', deferredSearch],
    queryFn: async () => {
      const { data } = await api.get('/api/members', {
        params: deferredSearch ? { q: deferredSearch } : {},
      });
      return data;
    },
  });

  const detailQuery = useQuery({
    queryKey: ['member-detail', selectedMemberId],
    enabled: Boolean(selectedMemberId),
    queryFn: async () => {
      const { data } = await api.get(`/api/members/${selectedMemberId}`);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/api/members', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Member added');
      setModalOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Could not add member');
    },
  });

  const remindMutation = useMutation({
    mutationFn: async (memberId) => {
      const { data } = await api.post(`/api/members/${memberId}/remind`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: () => {
      toast.error('Could not send reminder');
    },
  });

  const submitNewMember = (event) => {
    event.preventDefault();
    createMutation.mutate(form);
  };

  const members = membersQuery.data || [];

  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-xl flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by member name or email"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 outline-none transition focus:border-yellow-400 focus:bg-white"
            />
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-900 sm:w-auto"
          >
            <Plus size={18} />
            Add Member
          </button>
        </div>
      </section>

      <section className="space-y-3 md:hidden">
        {membersQuery.isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="panel p-4">
                <LoadingSkeleton className="h-20 w-full" />
              </div>
            ))
          : members.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMemberId(member.id)}
                className={`panel w-full p-4 text-left transition hover:border-slate-300 ${
                  member.status === 'at_risk' ? 'border-rose-200 bg-rose-50/60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                    {initials(member.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{member.name}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge(member.status)}`}>
                        {member.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-1 break-all text-sm text-slate-500">{member.email}</p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600">
                      <p>Plan: {member.plan_type}</p>
                      <p>Attendance: {member.attendance_rate}%</p>
                      <p>Last visit: {formatDate(member.last_visit)}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
      </section>

      <section className="panel hidden overflow-hidden md:block">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm font-semibold text-slate-500">
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Join Date</th>
                <th className="px-6 py-4">Last Visit</th>
                <th className="px-6 py-4">Attendance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {membersQuery.isLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4" colSpan={7}>
                        <LoadingSkeleton className="h-12 w-full" />
                      </td>
                    </tr>
                  ))
                : members.map((member) => (
                    <tr
                      key={member.id}
                      onClick={() => setSelectedMemberId(member.id)}
                      className={`cursor-pointer transition hover:bg-slate-50 ${
                        member.status === 'at_risk' ? 'bg-rose-50/60 hover:bg-rose-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                            {initials(member.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{member.name}</p>
                            <p className="text-sm text-slate-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                          {member.plan_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(member.join_date)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(member.last_visit)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">{member.attendance_rate}%</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge(member.status)}`}>
                          {member.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge(member.payment_status)}`}>
                          {(member.payment_status || 'unknown').replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </section>

      <Drawer
        open={Boolean(selectedMemberId)}
        title={detailQuery.data?.name || 'Member profile'}
        onClose={() => setSelectedMemberId(null)}
      >
        {detailQuery.isLoading || !detailQuery.data ? (
          <div className="space-y-4">
            <LoadingSkeleton className="h-28 w-full" />
            <LoadingSkeleton className="h-40 w-full" />
            <LoadingSkeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl bg-slate-950 p-5 text-white sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent text-xl font-bold text-slate-950">
                  {initials(detailQuery.data.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-2xl font-bold sm:text-3xl">{detailQuery.data.name}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge(detailQuery.data.status)}`}>
                      {detailQuery.data.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      <span className="break-all">{detailQuery.data.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      <span>{detailQuery.data.phone || 'No phone on file'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Plan</p>
                  <p className="mt-2 text-lg font-semibold capitalize">{detailQuery.data.plan_type}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Attendance</p>
                  <p className="mt-2 text-lg font-semibold">{detailQuery.data.attendance_rate}%</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Upcoming</p>
                  <p className="mt-2 text-lg font-semibold">{detailQuery.data.upcoming_bookings}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => remindMutation.mutate(detailQuery.data.id)}
                disabled={remindMutation.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-yellow-300 disabled:opacity-60 sm:w-auto"
              >
                <Send size={16} />
                Send Reminder
              </button>
            </div>

            <section className="space-y-3">
              <h4 className="font-display text-xl font-bold text-slate-900">Booking history</h4>
              {detailQuery.data.bookings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                  No bookings found for this member yet.
                </div>
              ) : (
                detailQuery.data.bookings.map((booking) => (
                  <div key={booking.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{booking.class_name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(booking.booked_at, { weekday: 'short', month: 'short', day: 'numeric' })} / {formatTime(booking.booked_at)} / {booking.trainer}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </section>

            <section className="space-y-3">
              <h4 className="font-display text-xl font-bold text-slate-900">Payment status</h4>
              {detailQuery.data.payments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
                  No payments found for this member yet.
                </div>
              ) : (
                detailQuery.data.payments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          ${payment.amount} / {payment.plan_type}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Due {formatDate(payment.due_date)} {payment.paid_date ? `/ Paid ${formatDate(payment.paid_date)}` : ''}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        )}
      </Drawer>

      <Modal
        open={modalOpen}
        title="Add Member"
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-member-form"
              disabled={createMutation.isPending}
              className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-900 disabled:opacity-60"
            >
              Create Member
            </button>
          </div>
        }
      >
        <form id="add-member-form" className="grid gap-4 sm:grid-cols-2" onSubmit={submitNewMember}>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-600">Full name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-400 focus:bg-white"
            />
          </label>
          <label className="block sm:col-span-2">
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
              type="text"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-400 focus:bg-white"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-600">Phone</span>
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-400 focus:bg-white"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-600">Plan</span>
            <select
              value={form.plan_type}
              onChange={(event) => setForm((current) => ({ ...current, plan_type: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-400 focus:bg-white"
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-600">Status</span>
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-400 focus:bg-white"
            >
              <option value="active">Active</option>
              <option value="at_risk">At Risk</option>
              <option value="churned">Churned</option>
            </select>
          </label>
        </form>
      </Modal>
    </div>
  );
}
