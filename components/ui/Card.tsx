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
    default: 'bg-secondary-800/50 backdrop-blur-sm border border-secondary-700',
    bordered: 'bg-secondary-800/50 backdrop-blur-sm border-2 border-primary',
    elevated: 'bg-secondary-800/50 backdrop-blur-sm shadow-card border border-secondary-700',
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
        'rounded-xl relative overflow-hidden group transition-colors duration-300',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {/* Gradient Border Glow on Hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(5, 161, 70, 0.2), rgba(59, 130, 246, 0.2))',
          borderRadius: 'inherit',
        }}
      />

      {/* Card Content */}
      <div className="relative z-10">
        {children}
      </div>
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
