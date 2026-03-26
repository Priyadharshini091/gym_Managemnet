import { featureStats, facilityHighlights } from '../data/siteContent';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">About</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-slate-950 sm:text-5xl">Built for gyms that want to look premium online.</h1>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            This website layer helps your gym feel more complete. Visitors can explore your space, see real training moments, read member stories, discover partner products, and pay online without getting lost.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {featureStats.map((item) => (
            <div key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">{item.label}</p>
              <p className="mt-3 font-display text-3xl font-bold text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {facilityHighlights.map((item) => (
          <article key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-display text-2xl font-bold text-slate-950">{item.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
