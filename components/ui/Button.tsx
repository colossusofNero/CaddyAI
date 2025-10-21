/**
 * Button Component
 * Reusable button with CaddyAI styling
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  icon,
  className,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-primary text-white hover:bg-primary-600 active:bg-primary-700 focus:ring-primary shadow-primary',
    secondary:
      'bg-secondary text-white hover:bg-secondary-700 active:bg-secondary-800 focus:ring-secondary',
    outline:
      'border-2 border-primary text-primary hover:bg-primary hover:text-white active:bg-primary-600 focus:ring-primary',
    ghost:
      'text-text-primary hover:bg-secondary-800 active:bg-secondary-700 focus:ring-secondary',
    danger:
      'bg-error text-white hover:bg-red-600 active:bg-red-700 focus:ring-error',
  };

  // Touch-optimized sizes (WCAG 2.1 Level AAA: min 44px)
  const sizes = {
    sm: 'text-sm px-4 h-10', // 40px height (for secondary actions)
    md: 'text-base px-6 h-11 sm:h-12', // 44px -> 48px (meets touch target)
    lg: 'text-lg px-8 h-12 sm:h-14', // 48px -> 56px (spacious for primary actions)
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
