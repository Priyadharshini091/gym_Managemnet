export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function formatDate(value, options = {}) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(value));
}

export function formatTime(value) {
  if (!value) {
    return '—';
  }

  const date = typeof value === 'string' && value.includes('T') ? new Date(value) : new Date(`2025-01-01T${value}`);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function statusBadge(status) {
  const map = {
    active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    at_risk: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    churned: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    due: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    overdue: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    confirmed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    cancelled: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    no_show: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  };
  return map[status] || 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
}

export function classTypeStyles(type) {
  const map = {
    yoga: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    hiit: 'border-rose-200 bg-rose-50 text-rose-800',
    pilates: 'border-sky-200 bg-sky-50 text-sky-800',
    strength: 'border-violet-200 bg-violet-50 text-violet-800',
  };
  return map[type] || 'border-slate-200 bg-slate-50 text-slate-700';
}

export function countdownLabel(isoDate) {
  const target = new Date(isoDate).getTime();
  const diff = target - Date.now();
  if (diff <= 0) {
    return 'Starting soon';
  }
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function startOfWeek(input = new Date()) {
  const date = new Date(input);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function toDateInputValue(value) {
  const date = new Date(value);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
