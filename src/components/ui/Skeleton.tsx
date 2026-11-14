export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-white/7 motion-reduce:animate-none ${className}`}
    />
  )
}
