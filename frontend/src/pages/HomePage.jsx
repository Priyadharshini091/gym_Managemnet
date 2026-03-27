import { ArrowRight, CreditCard, Dumbbell, Images, Quote, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { faqs, featureStats, facilityHighlights, galleryShots, membershipPlans, partnerProducts, testimonials } from '../data/siteContent';
import { formatCurrency } from '../lib/format';

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-800">
              <ShieldCheck size={16} />
              Premium gym website plus smart member portal
            </span>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight text-slate-950 sm:text-5xl lg:text-7xl">
              Train harder, book faster, and pay online without friction.
            </h1>
            <p className="mt-6 max-w-2xl text-base text-slate-600 sm:text-lg">
              GymFlow gives your gym a premium online presence with a modern home page, visual gallery, member stories,
              partner products, and an online payment experience that actually feels easy to use.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/membership-plans"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-900"
              >
                View Memberships
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/pay-online"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <CreditCard size={18} />
                Pay Online
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {featureStats.map((item) => (
                <div key={item.id} className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                  <p className="mt-3 font-display text-3xl font-bold text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-yellow-300/30 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-slate-950/10 blur-3xl" />
            <div className="grid gap-4 sm:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50">
                <div className="aspect-[4/5] overflow-hidden rounded-[1.5rem]">
                  <img
                    src={galleryShots[0].image}
                    alt={galleryShots[0].title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Inside the club</p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">{galleryShots[0].title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{galleryShots[0].subtitle}</p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-200/50">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-yellow-400 p-3 text-slate-950">
                      <Dumbbell size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">What members love</p>
                      <p className="mt-1 font-display text-2xl font-bold">Coaching plus convenience</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-300">
                    The gym floor, online booking, and invoice flow all work together so members keep showing up.
                  </p>
                </div>
                <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50">
                  <div className="aspect-[16/11] overflow-hidden rounded-[1.5rem]">
                    <img
                      src={galleryShots[2].image}
                      alt={galleryShots[2].title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Fast moving</p>
                      <p className="mt-1 font-semibold text-slate-900">{galleryShots[2].title}</p>
                    </div>
                    <Link to="/gallery" className="text-sm font-semibold text-slate-950 underline">
                      See gallery
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Why GymFlow</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-slate-950 sm:text-4xl">A gym website that feels premium, not generic.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {facilityHighlights.map((item) => (
            <div key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">{item.title}</p>
              <p className="mt-4 text-base leading-7 text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Membership Plans</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-950 sm:text-4xl">Make pricing and next steps feel clear.</h2>
          </div>
          <Link to="/membership-plans" className="text-sm font-semibold text-slate-950 underline">
            Explore all plans
          </Link>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {membershipPlans.map((plan) => (
            <article
              key={plan.id}
              className={`rounded-[2rem] border p-6 shadow-sm ${
                plan.highlight ? 'border-yellow-300 bg-yellow-50/60' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-700">
                  {plan.badge}
                </span>
                <span className="font-display text-3xl font-bold text-slate-950">{formatCurrency(plan.price)}</span>
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold text-slate-950">{plan.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{plan.summary}</p>
              <p className="mt-4 text-sm font-semibold text-slate-500">{plan.idealFor}</p>
              <Link
                to={`/register?plan=${plan.slug}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 underline"
              >
                Choose plan
                <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Gallery Preview</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-950 sm:text-4xl">Real energy, real members, real training atmosphere.</h2>
          </div>
          <Link to="/gallery" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 underline">
            <Images size={16} />
            Open full gallery
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {galleryShots.slice(0, 3).map((shot) => (
            <article key={shot.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="aspect-[5/4] overflow-hidden">
                <img src={shot.image} alt={shot.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
              </div>
              <div className="p-5">
                <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold uppercase text-yellow-800">{shot.tag}</span>
                <h3 className="mt-3 font-display text-2xl font-bold text-slate-950">{shot.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{shot.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Testimonials</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-950 sm:text-4xl">Members notice the difference fast.</h2>
          </div>
          <Link to="/testimonials" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950 underline">
            <Quote size={16} />
            Read all stories
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {testimonials.slice(0, 2).map((item) => (
            <article key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-lg leading-8 text-slate-700">"{item.quote}"</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                  {item.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{item.name}</p>
                  <p className="text-sm text-slate-500">
                    {item.role} / {item.result}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Partner Products</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-950 sm:text-4xl">Gym-approved supplements and recovery products.</h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-slate-950 underline">
            View products
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {partnerProducts.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="aspect-[4/4] overflow-hidden">
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{product.brand}</p>
                <h3 className="mt-2 font-semibold text-slate-950">{product.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{product.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-slate-950">${product.price}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">{product.badge}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[2.5rem] bg-slate-950 px-6 py-10 text-white sm:px-10 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Questions</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Everything important is easy to find on the site.</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((item) => (
              <div key={item.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <p className="font-semibold">{item.question}</p>
                <p className="mt-2 text-sm text-slate-300">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
