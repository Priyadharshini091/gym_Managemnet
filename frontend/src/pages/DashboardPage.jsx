import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowUpRight, CalendarDays, CreditCard, TrendingUp, Users } from 'lucide-react';
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/client';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { classTypeStyles, formatCurrency, formatDate, formatTime, initials, statusBadge } from '../lib/format';

const STATUS_COLORS = {
  active: '#22c55e',
  at_risk: '#facc15',
  churned: '#f43f5e',
};

function StatCard({ icon: Icon, label, value, hint }) {
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

export default function DashboardPage() {
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/stats');
      return data;
    },
  });

  const revenueQuery = useQuery({
    queryKey: ['dashboard-revenue'],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/revenue?months=6');
      return data;
    },
  });

  if (statsQuery.isLoading || revenueQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="panel p-5">
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton className="mt-4 h-12 w-28" />
              <LoadingSkeleton className="mt-4 h-4 w-36" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="panel p-6">
            <LoadingSkeleton className="h-6 w-52" />
            <LoadingSkeleton className="mt-6 h-72 w-full" />
          </div>
          <div className="space-y-6">
            <div className="panel p-6">
              <LoadingSkeleton className="h-6 w-36" />
              <LoadingSkeleton className="mt-6 h-56 w-full rounded-full" />
            </div>
            <div className="panel p-6">
              <LoadingSkeleton className="h-6 w-40" />
              <LoadingSkeleton className="mt-4 h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = statsQuery.data;
  const revenue = revenueQuery.data;
  const pieData = Object.entries(stats.status_breakdown).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Members"
          value={stats.total_members}
          hint="Seeded across active, at-risk, and churned segments."
        />
        <StatCard
          icon={CalendarDays}
          label="Active Today"
          value={stats.active_today}
          hint="Members with confirmed classes on today's roster."
        />
        <StatCard
          icon={CreditCard}
          label="Monthly Revenue"
          value={formatCurrency(stats.monthly_revenue)}
          hint="Paid invoices recorded in the current calendar month."
        />
        <StatCard
          icon={TrendingUp}
          label="No-show Rate"
          value={`${stats.no_show_rate}%`}
          hint="Trailing 30-day no-show share, excluding cancellations."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="panel p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Revenue</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-slate-900">Monthly trend</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              Last 6 months
            </div>
          </div>

          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#facc15" stopOpacity={0.65} />
                    <stop offset="100%" stopColor="#facc15" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#eab308"
                  strokeWidth={3}
                  fill="url(#revenueFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Members</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-slate-900">Status mix</h2>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={86}
                    paddingAngle={4}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {pieData.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="status-dot" style={{ backgroundColor: STATUS_COLORS[entry.name] }} />
                    <span className="font-semibold capitalize text-slate-700">{entry.name.replace('_', ' ')}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-500">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel border-yellow-200 bg-yellow-50/70 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-200 p-3 text-yellow-700">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-700/80">At Risk Members</p>
                <h2 className="font-display text-2xl font-bold text-slate-900">Needs attention</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {stats.at_risk_members.map((member) => (
                <div key={member.id} className="rounded-2xl border border-yellow-200 bg-white px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                        {initials(member.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">Last visit {formatDate(member.last_visit)}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge(member.status)}`}>
                      {member.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Operations</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-900">Today's classes</h2>
          </div>
          <div className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
            {stats.today_classes.length} scheduled
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {stats.today_classes.map((session) => (
            <div key={`${session.id}-${session.start_at}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${classTypeStyles(session.class_type)}`}>
                    {session.class_type}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">{session.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(session.start_at, { weekday: 'short', month: 'short', day: 'numeric' })} / {formatTime(session.start_at)} / {session.trainer}
                  </p>
                </div>
                <ArrowUpRight className="shrink-0 text-slate-300" />
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
                  <span>Capacity</span>
                  <span>
                    {session.booked_count}/{session.capacity}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.min((session.booked_count / session.capacity) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
