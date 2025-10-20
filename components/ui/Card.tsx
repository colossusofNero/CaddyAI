/**
 * Card Component
 * Reusable card container with CaddyAI styling
 */

import { HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-secondary border border-secondary-700',
    bordered: 'bg-secondary border-2 border-primary',
    elevated: 'bg-secondary shadow-card',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'rounded-xl',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  title?: string;
  description?: string;
}

export function CardHeader({
  children,
  title,
  description,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div className={clsx('mb-6', className)} {...props}>
      {title && (
        <h2 className="text-2xl font-bold text-text-primary mb-2">{title}</h2>
      )}
      {description && (
        <p className="text-text-secondary">{description}</p>
      )}
      {children}
    </div>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({
  children,
  className,
  ...props
}: CardContentProps) {
  return (
    <div className={clsx('space-y-4', className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({
  children,
  className,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={clsx('mt-6 flex items-center gap-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}
