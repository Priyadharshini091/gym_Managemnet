import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../api/client';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { formatCurrency, formatDate, statusBadge } from '../lib/format';
import { useAuthStore } from '../store/authStore';

function SummaryCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 font-display text-3xl font-bold text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>
        <div className="rounded-2xl bg-yellow-100 p-3 text-yellow-700">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function PaymentCard({ payment, onPay, isPending }) {
  const isOpen = payment.status === 'due' || payment.status === 'overdue';

  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
              {payment.plan_type}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge(payment.status)}`}>
              {payment.status}
            </span>
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold text-slate-950">{formatCurrency(payment.amount)}</h2>
          <div className="mt-3 space-y-1 text-sm text-slate-600">
            <p>Due date: {formatDate(payment.due_date, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            <p>Paid date: {formatDate(payment.paid_date, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        {isOpen ? (
          <button
            type="button"
            onClick={() => onPay(payment.id)}
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <CreditCard size={16} />
            {isPending ? 'Processing...' : 'Pay now'}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={16} />
            Cleared
          </div>
        )}
      </div>
    </article>
  );
}

function PaymentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <LoadingSkeleton className="h-5 w-32" />
            <LoadingSkeleton className="mt-4 h-10 w-28" />
            <LoadingSkeleton className="mt-3 h-4 w-48" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <LoadingSkeleton className="h-5 w-36" />
              <LoadingSkeleton className="mt-4 h-10 w-24" />
              <LoadingSkeleton className="mt-4 h-4 w-full" />
              <LoadingSkeleton className="mt-2 h-4 w-4/5" />
            </div>
          ))}
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <LoadingSkeleton className="h-6 w-40" />
          <LoadingSkeleton className="mt-6 h-4 w-full" />
          <LoadingSkeleton className="mt-2 h-4 w-5/6" />
          <LoadingSkeleton className="mt-6 h-4 w-full" />
          <LoadingSkeleton className="mt-2 h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}

function VisitorView() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-8 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-800">
            <ShieldCheck size={16} />
            Easy online invoice payments
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
            Let members pay their gym invoices directly on the website.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
            Sign in to view your active dues, pay outstanding invoices, and keep your membership current without calling
            the front desk.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-900"
            >
              Login to pay
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Create member account
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400 p-3 text-slate-950">
                <ReceiptText size={20} />
              </div>
              <div>
                <p className="font-semibold">Clear due invoices fast</p>
                <p className="text-sm text-slate-300">Members can see what is due right away.</p>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-950">Instant status updates</p>
                <p className="text-sm text-slate-600">Paid invoices update in the member account.</p>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 sm:col-span-2">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-yellow-100 p-3 text-yellow-700">
                <LockKeyhole size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-950">Member-only access</p>
                <p className="mt-1 text-sm text-slate-600">
                  The payment page is connected to the signed-in member account, so users only see and pay their own
                  invoices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayOnlinePage() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const member = useAuthStore((state) => state.member);
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ['public-pay-online'],
    enabled: Boolean(token && user?.role === 'member'),
    queryFn: async () => {
      const { data } = await api.get('/api/payments');
      return data;
    },
  });

  const payMutation = useMutation({
    mutationFn: async (paymentId) => {
      const { data } = await api.post(`/api/payments/${paymentId}/pay`);
      return data;
    },
    onSuccess: () => {
      toast.success('Payment completed successfully');
      queryClient.invalidateQueries({ queryKey: ['public-pay-online'] });
      queryClient.invalidateQueries({ queryKey: ['member-payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Could not complete payment');
    },
  });

  if (!token) {
    return <VisitorView />;
  }

  if (user?.role !== 'member') {
    const portalPath = user?.role === 'owner' ? '/dashboard' : '/trainer-portal';

    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            <Sparkles size={16} />
            Member-only payment page
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold text-slate-950">This page is designed for member payments.</h1>
          <p className="mt-4 text-base text-slate-600">
            You are signed in as a {user?.role}. Members can use this page to clear their own invoices, while staff can
            continue managing billing from the internal portal.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to={portalPath}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-900"
            >
              Go to portal
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (paymentsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <PaymentSkeleton />
      </div>
    );
  }

  if (paymentsQuery.isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-rose-200 bg-rose-50 p-8 text-rose-800">
          <h1 className="font-display text-3xl font-bold">We could not load your payments.</h1>
          <p className="mt-3 text-sm">
            Please refresh the page or try again once the backend is running and your member session is active.
          </p>
        </div>
      </div>
    );
  }

  const payments = paymentsQuery.data || [];
  const openInvoices = payments.filter((payment) => payment.status === 'due' || payment.status === 'overdue');
  const paidInvoices = payments.filter((payment) => payment.status === 'paid');
  const outstandingTotal = openInvoices.reduce((total, payment) => total + Number(payment.amount), 0);
  const nextDue = [...openInvoices].sort((left, right) => new Date(left.due_date) - new Date(right.due_date))[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Pay Online</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950 sm:text-5xl">A simple payment page for real gym members.</h1>
        <p className="mt-4 text-base text-slate-600 sm:text-lg">
          Signed in as {user?.name}. Review active invoices, clear dues quickly, and keep your {member?.plan_type || 'membership'} plan moving without friction.
        </p>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <SummaryCard
          icon={CreditCard}
          label="Outstanding balance"
          value={formatCurrency(outstandingTotal)}
          hint="Total amount from due and overdue invoices."
        />
        <SummaryCard
          icon={ReceiptText}
          label="Open invoices"
          value={openInvoices.length}
          hint="Invoices that still need payment."
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Paid invoices"
          value={paidInvoices.length}
          hint={
            nextDue
              ? `Next due ${formatDate(nextDue.due_date, { month: 'short', day: 'numeric', year: 'numeric' })}`
              : 'Everything is currently paid.'
          }
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-3xl font-bold text-slate-950">Your invoices</h2>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {payments.length} total
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
              <p className="font-semibold">No invoices found.</p>
              <p className="mt-2 text-sm">Your account does not have any payments listed right now.</p>
            </div>
          ) : (
            payments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                onPay={(paymentId) => payMutation.mutate(paymentId)}
                isPending={payMutation.isPending && payMutation.variables === payment.id}
              />
            ))
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Why this works well</p>
            <h2 className="mt-3 font-display text-3xl font-bold">Members can pay without extra steps.</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <p>The page is tied to the logged-in account, so invoices stay personal and easy to understand.</p>
              <p>Due payments and overdue payments are highlighted first so members know what needs action.</p>
              <p>Once paid, the invoice status updates immediately on the website.</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-100 p-3 text-yellow-700">
                <LockKeyhole size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-950">Member payment notes</p>
                <p className="text-sm text-slate-500">Clear and confidence-building for real users.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <p>Only invoices linked to your member account are shown here.</p>
              <p>Paid invoices stay visible so members have an easy billing history.</p>
              <p>If anything looks incorrect, the front desk can update the invoice from the admin portal.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
