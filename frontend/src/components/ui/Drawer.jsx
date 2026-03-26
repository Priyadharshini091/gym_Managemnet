export default function Drawer({ open, title, onClose, children }) {
  return (
    <div
      className={`fixed inset-0 z-50 transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-slate-950/30 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full transform border-l border-slate-200 bg-white shadow-2xl transition-transform sm:max-w-xl ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
          <h3 className="min-w-0 truncate font-display text-lg font-bold text-slate-900 sm:text-xl">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            Close
          </button>
        </div>
        <div className="h-[calc(100%-73px)] overflow-y-auto px-4 py-4 sm:h-[calc(100%-81px)] sm:px-6 sm:py-5">{children}</div>
      </aside>
    </div>
  );
}
