/**
 * Quote Selectors
 * Pure functions for deriving data from quote arrays
 * All functions are defensive and handle empty/invalid inputs gracefully
 */

import type { Quote, QuoteCounts } from '@/types/quote';
import { formatMoney } from './formatters';

/**
 * Calculate counts for all quote statuses
 * @param quotes - Array of quotes (defaults to empty array)
 * @returns Object with counts for each status
 *
 * @example
 * selectCounts([{status: 'draft'}, {status: 'sent'}])
 * // { all: 2, draft: 1, sent: 1, accepted: 0 }
 */
export function selectCounts(quotes: Quote[] = []): QuoteCounts {
  const all = quotes.length;
  const draft = quotes.filter((q) => q.status === 'draft').length;
  const sent = quotes.filter((q) => q.status === 'sent').length;
  const accepted = quotes.filter((q) => q.status === 'accepted').length;
  const rejected = quotes.filter((q) => q.status === 'rejected').length;
  const expired = quotes.filter((q) => q.status === 'expired').length;

  return { all, draft, sent, accepted, rejected, expired };
}

/**
 * Get most recent quotes, sorted by updatedAt (or createdAt as fallback)
 * @param quotes - Array of quotes
 * @param n - Number of recent quotes to return (default: 5)
 * @returns Array of most recent quotes
 *
 * @example
 * selectRecent(quotes, 5) // Returns last 5 quotes by date
 */
export function selectRecent(quotes: Quote[] = [], n: number = 5): Quote[] {
  if (!Array.isArray(quotes) || quotes.length === 0) {
    return [];
  }

  return [...quotes]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt ?? a.createdAt).getTime();
      const dateB = new Date(b.updatedAt ?? b.createdAt).getTime();
      return dateB - dateA; // Descending (newest first)
    })
    .slice(0, n);
}

/**
 * Compute the display total for a quote
 * Priority: 1) Use quote.total if present, 2) Compute from subtotal + tax, 3) Return '—'
 * @param quote - Quote object
 * @returns Formatted currency string or '—'
 *
 * @example
 * displayTotal({total: 1000}) // "$1,000.00"
 * displayTotal({subtotal: 1000, tax: 80}) // "$1,080.00"
 * displayTotal({subtotal: "abc"}) // "—"
 */
export function displayTotal(quote: Quote | null | undefined): string {
  if (!quote) {
    return '—';
  }

  const currency = quote.currency || 'USD';

  // Strategy 1: Use total if available and valid
  if (quote.total != null) {
    const total = typeof quote.total === 'string' ? Number(quote.total) : quote.total;
    if (Number.isFinite(total)) {
      return formatMoney(total, currency);
    }
  }

  // Strategy 2: Compute from subtotal + tax
  const subtotal =
    typeof quote.subtotal === 'string' ? Number(quote.subtotal) : quote.subtotal;
  const tax = typeof quote.tax === 'string' ? Number(quote.tax) : quote.tax;

  if (Number.isFinite(subtotal) && Number.isFinite(tax) && subtotal !== null && tax !== null && subtotal !== undefined && tax !== undefined) {
    const computed = subtotal + tax;
    return formatMoney(computed, currency);
  }

  // Strategy 3: Use subtotal alone if tax is missing
  if (Number.isFinite(subtotal)) {
    return formatMoney(subtotal, currency);
  }

  // Log warning for debugging (non-blocking)
  if (process.env.NODE_ENV === 'development') {
    console.warn('[displayTotal] Invalid quote amounts:', {
      id: quote.id,
      total: quote.total,
      subtotal: quote.subtotal,
      tax: quote.tax,
    });
  }

  return '—';
}

/**
 * Get status label for display
 * @param status - Quote status
 * @returns Human-readable status label
 */
export function getStatusLabel(
  status: Quote['status']
): { text: string; variant: 'default' | 'warning' | 'success' | 'error' } {
  const labels: Record<
    Quote['status'],
    { text: string; variant: 'default' | 'warning' | 'success' | 'error' }
  > = {
    draft: { text: 'Not yet sent', variant: 'default' },
    sent: { text: 'Awaiting response', variant: 'warning' },
    accepted: { text: 'Successful quotes', variant: 'success' },
    rejected: { text: 'Rejected', variant: 'error' },
    expired: { text: 'Expired', variant: 'error' },
  };

  return labels[status] || { text: status, variant: 'default' };
}

/**
 * Calculate total value of all accepted quotes
 * @param quotes - Array of quotes
 * @returns Total value as number or 0
 */
export function selectTotalAcceptedValue(quotes: Quote[] = []): number {
  return quotes
    .filter((q) => q.status === 'accepted')
    .reduce((sum, quote) => {
      const total = typeof quote.total === 'string' ? Number(quote.total) : quote.total;
      if (Number.isFinite(total) && total !== null && total !== undefined) {
        return sum + total;
      }

      // Fallback to subtotal + tax
      const subtotal =
        typeof quote.subtotal === 'string' ? Number(quote.subtotal) : quote.subtotal;
      const tax = typeof quote.tax === 'string' ? Number(quote.tax) : quote.tax;

      if (Number.isFinite(subtotal) && Number.isFinite(tax) && subtotal !== null && tax !== null && subtotal !== undefined && tax !== undefined) {
        return sum + subtotal + tax;
      }

      if (Number.isFinite(subtotal) && subtotal !== null && subtotal !== undefined) {
        return sum + subtotal;
      }

      return sum;
    }, 0);
}

/**
 * Filter quotes by status
 * @param quotes - Array of quotes
 * @param status - Status to filter by
 * @returns Filtered array
 */
export function selectByStatus(
  quotes: Quote[] = [],
  status: Quote['status']
): Quote[] {
  return quotes.filter((q) => q.status === status);
}

/**
 * Search quotes by client name or notes
 * @param quotes - Array of quotes
 * @param query - Search string
 * @returns Filtered array
 */
export function searchQuotes(quotes: Quote[] = [], query: string): Quote[] {
  if (!query || query.trim() === '') {
    return quotes;
  }

  const lowerQuery = query.toLowerCase();

  return quotes.filter((quote) => {
    const clientName = quote.client?.name?.toLowerCase() || '';
    const clientEmail = quote.client?.email?.toLowerCase() || '';
    const notes = quote.notes?.toLowerCase() || '';

    return (
      clientName.includes(lowerQuery) ||
      clientEmail.includes(lowerQuery) ||
      notes.includes(lowerQuery)
    );
  });
}
