import { Image as ImageIcon } from 'lucide-react';

import { BrandMark } from './BrandMark';

const windowClass =
  'absolute rounded-2xl border border-white/10 bg-linear-to-br from-white/7 to-white/2 shadow-2xl backdrop-blur-sm';

function WindowDots() {
  return (
    <span className="flex gap-1.5 p-3">
      {[0, 1, 2].map((dot) => (
        <span key={dot} className="size-2 rounded-full bg-slate-500/70" />
      ))}
    </span>
  );
}

function TextLines({ widths }: { widths: string[] }) {
  return (
    <span className="flex flex-col gap-2">
      {widths.map((width, index) => (
        <span key={index} className={`h-1.5 rounded-full bg-slate-500/40 ${width}`} />
      ))}
    </span>
  );
}

/** Purely decorative stack of "site" windows under the hero copy. */
export function LoginIllustration() {
  return (
    <div aria-hidden="true" className="relative mt-12 h-64 w-full max-w-lg select-none">
      <div className={`${windowClass} left-36 top-0 h-48 w-72 -rotate-3 opacity-70`}>
        <WindowDots />
        <div className="space-y-3 px-5 pt-6">
          <TextLines widths={['w-32', 'w-24', 'w-28']} />
        </div>
      </div>

      <div className={`${windowClass} left-0 top-8 h-56 w-80 -rotate-6`}>
        <WindowDots />
        <div className="flex gap-4 px-5 pt-2">
          <span className="flex h-20 w-28 items-center justify-center rounded-lg bg-white/6 text-slate-500">
            <ImageIcon className="size-10" />
          </span>
          <span className="pt-3">
            <TextLines widths={['w-24', 'w-20', 'w-16']} />
          </span>
        </div>
        <div className="px-5 pt-6">
          <TextLines widths={['w-56', 'w-44']} />
        </div>
      </div>

      <div className="absolute left-[19rem] top-4 flex size-24 rotate-6 items-center justify-center rounded-2xl border border-brand-400/30 bg-slate-900/80 shadow-[0_0_40px_-10px] shadow-brand-400/60 backdrop-blur">
        <BrandMark className="size-14 bg-none bg-transparent text-brand-400 shadow-none" />
      </div>

      <span className="absolute -left-6 bottom-6 size-1.5 rounded-full bg-brand-400 shadow-[0_0_12px] shadow-brand-400" />
      <span className="absolute right-4 top-24 size-1 rounded-full bg-brand-400/80" />
    </div>
  );
}
