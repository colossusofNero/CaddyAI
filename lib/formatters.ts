/**
 * Utility Formatters
 * Pure functions for formatting money, dates, and other display values
 * Handles edge cases and invalid inputs gracefully
 */

/**
 * Format a numeric value as currency
 * @param value - Number, string, null, or undefined
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string or '—' for invalid values
 *
 * @example
 * formatMoney(1499.5) // "$1,499.50"
 * formatMoney("1499.5") // "$1,499.50"
 * formatMoney(null) // "—"
 * formatMoney("abc") // "—"
 * formatMoney(NaN) // "—"
 */
export function formatMoney(
  value: number | string | null | undefined,
  currency: string = 'USD'
): string {
  // Guard against empty/invalid strings
  if (typeof value === 'string' && value.trim() === '') {
    return '—';
  }

  // Convert string to number if needed
  const num = typeof value === 'string' ? Number(value) : value;

  // Guard against invalid numbers
  if (!Number.isFinite(num) || num === null || num === undefined) {
    return '—';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num as number);
  } catch (error) {
    console.warn('[formatMoney] Formatting error:', { value, currency, error });
    return '—';
  }
}

/**
 * Format an ISO date string to a human-readable format
 * @param iso - ISO 8601 date string
 * @param timeZone - IANA timezone (default: 'America/Phoenix')
 * @param options - Additional formatting options
 * @returns Formatted date string or '—' for invalid dates
 *
 * @example
 * formatDate('2025-10-27T12:00:00Z') // "Oct 27, 2025"
 * formatDate('invalid') // "—"
 * formatDate(null) // "—"
 */
export function formatDate(
  iso: string | null | undefined,
  timeZone: string = 'America/Phoenix',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!iso) {
    return '—';
  }

  try {
    const date = new Date(iso);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '—';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    };

    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch (error) {
    console.warn('[formatDate] Parsing error:', { iso, error });
    return '—';
  }
}

/**
 * Format a date with time
 * @param iso - ISO 8601 date string
 * @param timeZone - IANA timezone (default: 'America/Phoenix')
 * @returns Formatted datetime string or '—' for invalid dates
 *
 * @example
 * formatDateTime('2025-10-27T12:00:00Z') // "Oct 27, 2025 at 5:00 AM"
 */
export function formatDateTime(
  iso: string | null | undefined,
  timeZone: string = 'America/Phoenix'
): string {
  return formatDate(iso, timeZone, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a relative time (e.g., "2 hours ago", "3 days ago")
 * @param iso - ISO 8601 date string
 * @returns Relative time string or '—' for invalid dates
 *
 * @example
 * formatRelativeTime('2025-10-27T12:00:00Z') // "2 hours ago"
 */
export function formatRelativeTime(
  iso: string | null | undefined
): string {
  if (!iso) {
    return '—';
  }

  try {
    const date = new Date(iso);

    if (isNaN(date.getTime())) {
      return '—';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    } else if (diffDay < 30) {
      return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    } else {
      return formatDate(iso);
    }
  } catch (error) {
    console.warn('[formatRelativeTime] Error:', { iso, error });
    return '—';
  }
}

/**
 * Format a percentage value
 * @param value - Number between 0 and 1 (or 0-100)
 * @param normalize - If true, expects 0-100; if false, expects 0-1
 * @returns Formatted percentage string or '—' for invalid values
 *
 * @example
 * formatPercent(0.75) // "75%"
 * formatPercent(75, true) // "75%"
 * formatPercent(null) // "—"
 */
export function formatPercent(
  value: number | null | undefined,
  normalize: boolean = false
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }

  const percent = normalize ? value : value * 100;
  return `${percent.toFixed(1)}%`;
}

/**
 * Format a large number with abbreviations (K, M, B)
 * @param value - Numeric value
 * @returns Abbreviated string or '—' for invalid values
 *
 * @example
 * formatCompactNumber(1500) // "1.5K"
 * formatCompactNumber(1500000) // "1.5M"
 */
export function formatCompactNumber(
  value: number | null | undefined
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }

  try {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return value.toString();
  }
}
