/**
 * Icon Component
 * Standardized icon system using Lucide React with consistent sizes and variants
 */

import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconVariant = 'default' | 'primary' | 'secondary' | 'accent' | 'muted' | 'white';

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  variant?: IconVariant;
  className?: string;
  strokeWidth?: number;
}

/**
 * Icon Size Mapping
 * - xs: 16px (w-4 h-4) - For inline text icons
 * - sm: 20px (w-5 h-5) - For buttons, cards
 * - md: 24px (w-6 h-6) - Default size
 * - lg: 32px (w-8 h-8) - For feature cards
 * - xl: 48px (w-12 h-12) - For hero sections
 */
const sizeClasses: Record<IconSize, string> = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

/**
 * Icon Variant Colors
 * Maps to the CaddyAI color system
 */
const variantClasses: Record<IconVariant, string> = {
  default: 'text-text-primary',
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  muted: 'text-text-muted',
  white: 'text-white',
};

/**
 * Standard stroke widths for different sizes
 */
const strokeWidthBySize: Record<IconSize, number> = {
  xs: 2,
  sm: 2,
  md: 2,
  lg: 2,
  xl: 1.5,
};

/**
 * Icon Component
 *
 * @example
 * ```tsx
 * import { Icon } from '@/components/ui/Icon';
 * import { Target } from 'lucide-react';
 *
 * <Icon icon={Target} size="md" variant="primary" />
 * ```
 */
export function Icon({
  icon: LucideIcon,
  size = 'md',
  variant = 'default',
  className,
  strokeWidth,
}: IconProps) {
  return (
    <LucideIcon
      className={clsx(
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      strokeWidth={strokeWidth ?? strokeWidthBySize[size]}
    />
  );
}

/**
 * Convenience components for common icon patterns
 */

interface IconWithBackgroundProps extends IconProps {
  backgroundVariant?: 'primary' | 'secondary' | 'accent' | 'muted';
  rounded?: boolean;
}

/**
 * Icon with colored background circle/square
 * Commonly used in feature cards and stat displays
 */
export function IconWithBackground({
  icon: LucideIcon,
  size = 'lg',
  variant = 'white',
  backgroundVariant = 'primary',
  rounded = false,
  className,
  ...props
}: IconWithBackgroundProps) {
  const containerSizeClasses: Record<IconSize, string> = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  const backgroundClasses: Record<string, string> = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
    muted: 'bg-neutral-300',
  };

  return (
    <div
      className={clsx(
        'flex items-center justify-center',
        containerSizeClasses[size],
        backgroundClasses[backgroundVariant],
        rounded ? 'rounded-full' : 'rounded-xl',
        'shadow-md',
        className
      )}
    >
      <Icon
        icon={LucideIcon}
        size={size}
        variant={variant}
        {...props}
      />
    </div>
  );
}

/**
 * Icon with gradient background
 * Used for premium/featured sections
 */
export function IconWithGradient({
  icon: LucideIcon,
  size = 'lg',
  variant = 'white',
  rounded = false,
  className,
  ...props
}: IconWithBackgroundProps) {
  const containerSizeClasses: Record<IconSize, string> = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  return (
    <div
      className={clsx(
        'flex items-center justify-center',
        containerSizeClasses[size],
        'bg-gradient-to-br from-primary to-accent',
        rounded ? 'rounded-full' : 'rounded-xl',
        'shadow-lg',
        className
      )}
    >
      <Icon
        icon={LucideIcon}
        size={size}
        variant={variant}
        {...props}
      />
    </div>
  );
}

/**
 * Animated icon wrapper
 * For interactive elements that need hover effects
 */
interface AnimatedIconProps extends IconProps {
  animation?: 'pulse' | 'bounce' | 'spin' | 'none';
}

export function AnimatedIcon({
  animation = 'none',
  className,
  ...props
}: AnimatedIconProps) {
  const animationClasses: Record<string, string> = {
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    spin: 'animate-spin',
    none: '',
  };

  return (
    <Icon
      className={clsx(animationClasses[animation], className)}
      {...props}
    />
  );
}

/**
 * Export common icon configurations for consistency
 */
export const iconConfig = {
  // Button icons
  button: { size: 'sm' as IconSize, variant: 'white' as IconVariant },

  // Navigation icons
  nav: { size: 'sm' as IconSize, variant: 'default' as IconVariant },

  // Feature card icons
  feature: { size: 'lg' as IconSize, variant: 'white' as IconVariant },

  // Input/Form icons
  input: { size: 'sm' as IconSize, variant: 'muted' as IconVariant },

  // Badge/Chip icons
  badge: { size: 'xs' as IconSize, variant: 'primary' as IconVariant },

  // Hero section icons
  hero: { size: 'xl' as IconSize, variant: 'primary' as IconVariant },
};
