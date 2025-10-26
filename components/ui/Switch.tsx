/**
 * Switch Component
 * Toggle switch for boolean preferences
 */

import { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  className,
  ...props
}: SwitchProps) {
  return (
    <label
      className={clsx(
        'flex items-start gap-3 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={clsx(
            'w-11 h-6 rounded-full transition-colors duration-200',
            'peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2 peer-focus:ring-offset-background',
            checked ? 'bg-primary' : 'bg-secondary-700'
          )}
        >
          <div
            className={clsx(
              'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200',
              checked && 'translate-x-5'
            )}
          />
        </div>
      </div>
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <div className="text-sm font-medium text-text-primary">{label}</div>
          )}
          {description && (
            <div className="text-xs text-text-muted mt-1">{description}</div>
          )}
        </div>
      )}
    </label>
  );
}
