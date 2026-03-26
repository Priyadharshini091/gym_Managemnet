export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="panel-soft max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[2rem]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <h3 className="min-w-0 truncate font-display text-lg font-bold text-slate-900 sm:text-xl">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            Close
          </button>
        </div>
        <div className="max-h-[68vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>
        {footer ? <div className="border-t border-slate-200 px-4 py-4 sm:px-6">{footer}</div> : null}
      </div>
    </div>
  );
}
