import { Clock3, Mail, MapPin, PhoneCall } from 'lucide-react';
import { Link } from 'react-router-dom';
import MembershipEnquiryForm from '../components/marketing/MembershipEnquiryForm';

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
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Contact</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-slate-950 sm:text-5xl">Give future members a fast way to ask about joining.</h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            This contact flow is now geared toward membership enquiries, trial questions, billing clarity, and help picking the right plan.
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
                to="/membership-plans"
                className="inline-flex items-center justify-center rounded-full bg-yellow-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-yellow-300"
              >
                View membership plans
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Join now
              </Link>
            </div>
          </div>
        </section>

        <MembershipEnquiryForm
          title="Send a membership enquiry"
          subtitle="Ask about plan pricing, class access, personal training, trial visits, or the best fit for your goals."
        />
      </div>
    </div>
  );
}
