import { partnerProducts } from '../data/siteContent';

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Partner Products</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-slate-950 sm:text-5xl">Supplements and gym collaborations that fit the brand.</h1>
        <p className="mt-4 text-base text-slate-600 sm:text-lg">
          Add partner brands like protein, pre-workout, recovery stacks, and snack bundles so your website feels like a full gym ecosystem, not only a schedule page.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {partnerProducts.map((product) => (
          <article key={product.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="aspect-[4/4] overflow-hidden">
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">{product.brand}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">{product.category}</span>
              </div>
              <h2 className="mt-3 font-semibold text-slate-950">{product.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{product.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl font-bold text-slate-950">${product.price}</span>
                <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold uppercase text-yellow-800">{product.badge}</span>
              </div>
              <button
                type="button"
                className="mt-5 w-full rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Ask at front desk
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
