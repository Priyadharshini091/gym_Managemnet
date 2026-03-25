export default function LoadingSkeleton({ className = 'h-5 w-full' }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />;
}
