export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-400 text-ink-950 shadow-glow hover:bg-brand-300 active:bg-brand-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none',
  secondary:
    'border border-white/10 bg-white/6 text-white hover:border-white/20 hover:bg-white/10 disabled:text-slate-600',
  ghost: 'text-slate-300 hover:bg-white/6 hover:text-white disabled:text-slate-600',
  danger: 'bg-red-500/12 text-red-300 ring-1 ring-inset ring-red-400/20 hover:bg-red-500/20',
}

export function buttonClass(variant: ButtonVariant = 'primary', className = '') {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold transition duration-200 focus-ring disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`
}
