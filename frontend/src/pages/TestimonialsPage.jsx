import { Quote } from 'lucide-react';
import { testimonials } from '../data/siteContent';

export default function TestimonialsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Testimonials</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950 sm:text-5xl">Member stories that turn interest into trust.</h1>
        <p className="mt-4 text-base text-slate-600 sm:text-lg">
          This page gives future members proof that the gym experience is structured, supportive, and worth paying for.
        </p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        {testimonials.map((item) => (
          <article key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-100 p-3 text-yellow-700">
                <Quote size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-950">{item.name}</p>
                <p className="text-sm text-slate-500">
                  {item.role} / {item.result}
                </p>
              </div>
            </div>
            <p className="mt-6 text-lg leading-8 text-slate-700">"{item.quote}"</p>
          </article>
        ))}
      </div>
    </div>
  );
}
