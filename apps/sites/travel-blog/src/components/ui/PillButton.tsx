import React from 'react';
import Link from 'next/link';

interface PillButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export function PillButton({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  className = '',
  type = 'button',
  disabled = false,
}: PillButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-full transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md hover:shadow-emerald-600/20',
    secondary:
      'bg-teal-900 hover:bg-teal-950 text-white shadow-xs',
    outline:
      'border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
    ghost:
      'text-foreground hover:bg-muted/70',
    glass:
      'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800 text-foreground shadow-2xs hover:bg-white dark:hover:bg-neutral-900',
  }[variant];

  const content = (
    <>
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
    >
      {content}
    </button>
  );
}

