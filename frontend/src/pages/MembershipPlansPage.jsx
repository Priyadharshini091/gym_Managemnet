import { ArrowRight, BadgeCheck, Clock3, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MembershipEnquiryForm from '../components/marketing/MembershipEnquiryForm';
import { membershipFaqs, membershipPerks, membershipPlans } from '../data/siteContent';
import { formatCurrency } from '../lib/format';

function PlanCard({ plan, onEnquire }) {
  return (
    <article
      className={`rounded-[2rem] border p-6 shadow-sm transition ${
        plan.highlight
          ? 'border-yellow-300 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.18),transparent_20rem),linear-gradient(180deg,#fffdf5_0%,#ffffff_100%)] shadow-yellow-400/20'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-700">
            {plan.badge}
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-slate-950">{plan.name}</h2>
          <p className="mt-2 text-sm text-slate-500">{plan.summary}</p>
        </div>
        {plan.highlight ? (
          <div className="rounded-2xl bg-yellow-400 p-3 text-slate-950">
            <Sparkles size={20} />
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex items-end gap-2">
        <p className="font-display text-5xl font-bold text-slate-950">{formatCurrency(plan.price)}</p>
        <p className="pb-1 text-sm text-slate-500">{plan.billing}</p>
      </div>

      <p className="mt-4 rounded-[1.5rem] bg-slate-50 px-4 py-3 text-sm text-slate-600">{plan.idealFor}</p>

      <div className="mt-6 space-y-3">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-700">
              <BadgeCheck size={14} />
            </div>
            <p className="text-sm text-slate-700">{feature}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to={`/register?plan=${plan.slug}`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
        >
          Choose {plan.name}
          <ArrowRight size={16} />
        </Link>
        <button
          type="button"
          onClick={() => onEnquire(plan.slug)}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Ask about this plan
        </button>
      </div>
    </article>
  );
}

export default function MembershipPlansPage() {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const enquiryRef = useRef(null);

  const handleEnquire = (planSlug) => {
    setSelectedPlan(planSlug);
    enquiryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-800">
              <Clock3 size={16} />
              Flexible plans with a real enquiry flow
            </span>
            <h1 className="mt-6 max-w-4xl font-display text-4xl font-bold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Membership plans that give visitors a clear next step.
            </h1>
            <p className="mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
              Show the value of each membership clearly, then let prospective members enquire before they commit.
              This gives your gym a stronger website and a more professional lead capture flow.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register?plan=premium"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-900"
              >
                Join with Momentum
                <ArrowRight size={18} />
              </Link>
              <button
                type="button"
                onClick={() => enquiryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Send enquiry
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {membershipPerks.map((perk) => (
              <div key={perk.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">{perk.title}</p>
                <p className="mt-4 text-sm leading-7 text-slate-600">{perk.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Plans</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-slate-950 sm:text-4xl">Choose the right membership path.</h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Each plan is framed around what members actually care about: access, classes, accountability, and how easy
            it is to stay consistent.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          {membershipPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onEnquire={handleEnquire} />
          ))}
        </div>
      </section>

      <section ref={enquiryRef} className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2.5rem] bg-slate-950 p-6 text-white sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">What happens next</p>
            <h2 className="mt-3 font-display text-3xl font-bold">Capture the enquiry before the visitor disappears.</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <p>Prospective members can ask about the best plan, trial options, personal training, or billing before they sign up.</p>
              <p>The enquiry is stored in the backend, so your team has a real lead record instead of a fake form placeholder.</p>
              <p>When a visitor is already confident, the plan cards still send them straight into the register flow.</p>
            </div>
          </div>

          <MembershipEnquiryForm
            title="Ask about a membership"
            subtitle="Tell us your goals, the plan you're considering, and how you want the team to reply."
            defaultPlan={selectedPlan}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">FAQ</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-950">Questions future members usually ask first.</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {membershipFaqs.map((item) => (
              <article key={item.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold text-slate-950">{item.question}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
