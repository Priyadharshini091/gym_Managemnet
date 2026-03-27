import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { membershipPlans } from '../../data/siteContent';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  preferred_plan: '',
  fitness_goal: '',
  preferred_contact: 'email',
  message: '',
};

export default function MembershipEnquiryForm({
  title = 'Membership enquiry',
  subtitle = 'Tell us what you want help with and the team can recommend the right plan.',
  defaultPlan = '',
  submitLabel = 'Send enquiry',
  panelClassName = '',
}) {
  const [form, setForm] = useState({ ...initialForm, preferred_plan: defaultPlan || '' });

  useEffect(() => {
    setForm((current) => ({ ...current, preferred_plan: defaultPlan || '' }));
  }, [defaultPlan]);

  const enquiryMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/api/membership-enquiries', payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Enquiry sent');
      setForm({ ...initialForm, preferred_plan: defaultPlan || '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Could not send your enquiry');
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    enquiryMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      preferred_plan: form.preferred_plan || null,
      fitness_goal: form.fitness_goal.trim() || null,
      preferred_contact: form.preferred_contact || null,
      message: form.message.trim(),
    });
  };

  return (
    <section className={`rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 ${panelClassName}`.trim()}>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Membership enquiry</p>
        <h2 className="mt-3 font-display text-3xl font-bold text-slate-950">{title}</h2>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-yellow-400 focus:bg-white"
            placeholder="Your full name"
            required
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-yellow-400 focus:bg-white"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Phone</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-yellow-400 focus:bg-white"
              placeholder="+1 555-0100"
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Preferred plan</span>
            <select
              value={form.preferred_plan}
              onChange={(event) => setForm((current) => ({ ...current, preferred_plan: event.target.value }))}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-yellow-400 focus:bg-white"
            >
              <option value="">Need a recommendation</option>
              {membershipPlans.map((plan) => (
                <option key={plan.slug} value={plan.slug}>
                  {plan.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">Preferred contact</span>
            <select
              value={form.preferred_contact}
              onChange={(event) => setForm((current) => ({ ...current, preferred_contact: event.target.value }))}
              className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-yellow-400 focus:bg-white"
            >
              <option value="email">Email me</option>
              <option value="phone">Call me</option>
              <option value="whatsapp">WhatsApp me</option>
            </select>
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Primary goal</span>
          <input
            type="text"
            value={form.fitness_goal}
            onChange={(event) => setForm((current) => ({ ...current, fitness_goal: event.target.value }))}
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-yellow-400 focus:bg-white"
            placeholder="Weight loss, strength, accountability, classes, recovery..."
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Message</span>
          <textarea
            rows="6"
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-yellow-400 focus:bg-white"
            placeholder="Tell us your schedule, training goals, budget, or anything you want the team to know."
            minLength={10}
            required
          />
        </label>

        <button
          type="submit"
          disabled={enquiryMutation.isPending}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enquiryMutation.isPending ? 'Sending...' : submitLabel}
        </button>
      </form>
    </section>
  );
}
