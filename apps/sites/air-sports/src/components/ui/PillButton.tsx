import React, { type ReactNode } from 'react';
import Link from 'next/link';

interface PillButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export function PillButton({
  href,
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  disabled = false,
}: PillButtonProps) {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  }[size];

  const variantClasses = {
    primary:
      'bg-sky-600 text-white hover:bg-sky-500 shadow-sm shadow-sky-600/20 active:scale-95',
    secondary:
      'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-600/20 active:scale-95',
    outline:
      'border border-border bg-card/80 text-foreground hover:bg-muted hover:border-foreground/30 active:scale-95',
    glass:
      'border border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 active:scale-95',
  }[variant];

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </>
  );

  const baseClasses = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${variantClasses} ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={baseClasses}>
      {content}
    </button>
  );
}

