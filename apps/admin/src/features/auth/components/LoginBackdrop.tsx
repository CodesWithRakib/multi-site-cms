/** Decorative glows and dot grids behind the sign-in screen. */
export function LoginBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-40 -top-40 size-[36rem] rounded-full bg-brand-500/15 blur-3xl" />
      <div className="absolute -bottom-48 -right-32 size-[40rem] rounded-full bg-brand-600/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 size-[28rem] -translate-x-1/2 rounded-full bg-brand-700/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-[46rem] -rotate-6 rounded-[100%] border-t-2 border-brand-400/30" />
      <div className="absolute left-12 top-12 size-20 bg-[radial-gradient(circle,var(--color-slate-500)_1.5px,transparent_1.5px)] bg-size-[20px_20px] opacity-40" />
      <div className="absolute bottom-12 right-12 size-20 bg-[radial-gradient(circle,var(--color-slate-500)_1.5px,transparent_1.5px)] bg-size-[20px_20px] opacity-40" />
    </div>
  );
}
