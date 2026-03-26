import { Clock3, Mail, MapPin, PhoneCall } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const initialForm = {
  name: '',
  email: '',
  goal: '',
  message: '',
};

function InfoCard({ icon: Icon, title, body }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-yellow-100 p-3 text-yellow-700">
          <Icon size={20} />
        </div>
        <div>
          <p className="font-semibold text-slate-950">{title}</p>
          <p className="mt-2 text-sm text-slate-600">{body}</p>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in your name, email, and message.');
      return;
    }

    toast.success('Message ready. Connect this form to your backend contact endpoint when needed.');
    setForm(initialForm);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Contact</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-slate-950 sm:text-5xl">Give visitors a clear way to reach the gym.</h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            This page helps future members ask about memberships, trials, personal training, class schedules, and product availability.
          </p>

          <div className="mt-8 grid gap-4">
            <InfoCard icon={MapPin} title="Visit us" body="FitZone Premium Gym, 24 Fitness Avenue, Downtown District" />
            <InfoCard icon={Clock3} title="Opening hours" body="Monday to Sunday, 6:00 AM to 10:00 PM" />
            <InfoCard icon={PhoneCall} title="Call the front desk" body="+1 555-0100" />
            <InfoCard icon={Mail} title="Email support" body="support@gymflow.com" />
          </div>

          <div className="mt-8 rounded-[2rem] bg-slate-950 p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Popular actions</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-yellow-300"
              >
                Join now
              </Link>
              <Link
                to="/pay-online"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Pay online
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Send a message</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-950">Simple enquiry form for your website.</h2>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-slate-300 focus:bg-white"
                placeholder="Your full name"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-slate-300 focus:bg-white"
                placeholder="you@example.com"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Goal</span>
              <select
                value={form.goal}
                onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-slate-300 focus:bg-white"
              >
                <option value="">Select one</option>
                <option value="membership">Membership details</option>
                <option value="personal-training">Personal training</option>
                <option value="classes">Class schedule</option>
                <option value="products">Products and supplements</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700">Message</span>
              <textarea
                rows="6"
                value={form.message}
                onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-300 focus:bg-white"
                placeholder="Tell us what you need help with."
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-900"
            >
              Send message
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
