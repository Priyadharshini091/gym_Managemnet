import { galleryShots } from '../data/siteContent';

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Gallery</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950 sm:text-5xl">A visual feel for the gym, classes, and member vibe.</h1>
        <p className="mt-4 text-base text-slate-600 sm:text-lg">
          These gallery blocks help your website feel alive. They showcase training energy, recovery spaces, coaching moments, and the social side of membership.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {galleryShots.map((shot, index) => (
          <article
            key={shot.id}
            className={`overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm ${index % 3 === 0 ? 'xl:translate-y-8' : ''}`}
          >
            <div className="aspect-[4/5] overflow-hidden">
              <img src={shot.image} alt={shot.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold uppercase text-yellow-800">{shot.tag}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">FitZone</span>
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold text-slate-950">{shot.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{shot.subtitle}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
