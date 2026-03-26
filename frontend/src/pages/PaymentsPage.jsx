import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, CreditCard, ReceiptText, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { formatCurrency, formatDate, statusBadge } from '../lib/format';

const FILTERS = ['all', 'paid', 'due', 'overdue'];

function SummaryCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="panel p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 break-words font-display text-3xl font-bold text-slate-900 sm:text-4xl">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ['payments', statusFilter],
    queryFn: async () => {
      const { data } = await api.get('/api/payments', {
        params: statusFilter === 'all' ? {} : { status: statusFilter },
      });
      return data;
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/api/payments/bulk-remind');
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: () => {
      toast.error('Could not queue reminders');
    },
  });

  if (paymentsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="panel p-5">
              <LoadingSkeleton className="h-5 w-24" />
              <LoadingSkeleton className="mt-4 h-12 w-40" />
            </div>
          ))}
        </div>
        <div className="panel p-6">
          <LoadingSkeleton className="h-8 w-48" />
          <LoadingSkeleton className="mt-6 h-72 w-full" />
        </div>
      </div>
    );
  }

  const payments = paymentsQuery.data || [];
  const now = new Date();
  const monthRevenue = payments
    .filter((payment) => payment.status === 'paid' && payment.paid_date && new Date(payment.paid_date).getMonth() === now.getMonth())
    .reduce((total, payment) => total + Number(payment.amount), 0);
  const overdueCount = payments.filter((payment) => payment.status === 'overdue').length;
  const dueCount = payments.filter((payment) => payment.status === 'due').length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          icon={TrendingUp}
          label="Monthly Revenue"
          value={formatCurrency(monthRevenue)}
          hint="Paid invoices captured this month."
        />
        <SummaryCard
          icon={ReceiptText}
          label="Due Payments"
          value={dueCount}
          hint="Invoices that still need attention."
        />
        <SummaryCard
          icon={CreditCard}
          label="Overdue"
          value={overdueCount}
          hint="Late payments currently flagged by the backend."
        />
      </section>

      <section className="panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  statusFilter === filter
                    ? 'bg-slate-950 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'all' ? 'All statuses' : filter}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => bulkMutation.mutate()}
            disabled={bulkMutation.isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-300 disabled:opacity-60 sm:w-auto"
          >
            <BellRing size={18} />
            Send Bulk Reminder
          </button>
        </div>
      </section>

      <section className="space-y-3 md:hidden">
        {payments.length === 0 ? (
          <div className="panel p-5 text-sm text-slate-500">No payments found for this filter.</div>
        ) : (
          payments.map((payment) => (
            <div key={payment.id} className="panel p-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{payment.member_name}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge(payment.status)}`}>
                    {payment.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                    {payment.plan_type}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{formatCurrency(payment.amount)}</span>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>Due: {formatDate(payment.due_date)}</p>
                  <p>Paid: {formatDate(payment.paid_date)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="panel hidden overflow-hidden md:block">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm font-semibold text-slate-500">
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Paid Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {payments.map((payment) => (
                <tr key={payment.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{payment.member_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                      {payment.plan_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{formatCurrency(payment.amount)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(payment.due_date)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(payment.paid_date)}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
