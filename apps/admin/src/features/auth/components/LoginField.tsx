'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { Input, Label, cn } from '@multi-site-cms/ui';

type LoginFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  id: string;
  label: string;
  icon: ReactNode;
  /** Labels for the visibility toggle; when set, the field is a password field. */
  reveal?: { show: string; hide: string };
};

const inputClass =
  'h-12 rounded-xl border-white/10 bg-white/3 pl-12 text-sm text-slate-50 placeholder:text-slate-400 hover:border-white/20 focus-visible:border-brand-400 focus-visible:ring-brand-400/30 focus-visible:ring-offset-0';

/** Labelled input with a leading icon and an optional password reveal toggle. */
export function LoginField({
  id,
  label,
  icon,
  reveal,
  type,
  className,
  ...props
}: LoginFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputType = reveal ? (visible ? 'text' : 'password') : type;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-100">
        {label}
      </Label>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 [&_svg]:size-5"
        >
          {icon}
        </span>
        <Input
          id={id}
          type={inputType}
          className={cn(inputClass, reveal && 'pr-12', className)}
          {...props}
        />
        {reveal && (
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? reveal.hide : reveal.show}
            aria-pressed={visible}
            aria-controls={id}
            className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </div>
    </div>
  );
}
