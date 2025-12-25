/**
 * Input Component
 * Reusable form input with Copperline Golf styling
 */

import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = props.id || props.name || 'input';

    return (
      <div className={clsx('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full px-4 rounded-lg',
              'h-11 sm:h-12', // Touch-optimized: 44px -> 48px (WCAG 2.1 AAA)
              'bg-secondary border-2 border-secondary-700',
              'text-base text-white', // White text on dark background
              'placeholder:text-gray-400',
              'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-secondary-800',
              error &&
                'border-error focus:border-error focus:ring-error focus:ring-opacity-20',
              icon && 'pl-10',
              className
            )}
            disabled={disabled}
            {...props}
          />
        </div>

        {error && (
          <p className="text-sm text-error flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="text-sm text-text-secondary">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
