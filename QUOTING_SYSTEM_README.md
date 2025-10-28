# Quoting System - Implementation Guide

## Overview

This document describes the robust, production-ready quoting system utilities that handle currency formatting, date/time display, and quote data manipulation with comprehensive edge-case handling.

## Features

✅ **Zero `$NaN` errors** - All numeric operations are guarded with `Number.isFinite()`
✅ **Graceful degradation** - Invalid inputs return `'—'` instead of crashing
✅ **Timezone-aware** - Dates formatted in `America/Phoenix` by default
✅ **Type-safe** - Full TypeScript support with strict types
✅ **Tested** - 46 unit tests covering all edge cases
✅ **Pure functions** - No side effects, easy to test and reason about

---

## File Structure

```
lib/
├── formatters.ts              # Currency, date, number formatting
├── quoteSelectors.ts          # Pure data selectors for quotes
├── __tests__/
│   ├── formatters.test.ts     # 18 tests for formatters
│   └── quoteSelectors.test.ts # 28 tests for selectors
types/
└── quote.ts                   # TypeScript types for Quote system
```

---

## API Reference

### Formatters (`lib/formatters.ts`)

#### `formatMoney(value, currency?)`

Formats a numeric value as currency. **Never returns `$NaN`**.

```typescript
formatMoney(1499.5)       // "$1,499.50"
formatMoney("1499.5")     // "$1,499.50"  (parses strings)
formatMoney(null)         // "—"
formatMoney("abc")        // "—"
formatMoney(NaN)          // "—"
formatMoney(Infinity)     // "—"
formatMoney("")           // "—"
formatMoney(1000, 'EUR')  // "€1,000.00"
```

**Edge cases handled:**
- `null`, `undefined`
- `NaN`, `Infinity`, `-Infinity`
- Empty strings, non-numeric strings
- Unparseable values

---

#### `formatDate(iso, timeZone?, options?)`

Formats ISO 8601 date strings in a specific timezone.

```typescript
formatDate('2025-10-27T12:00:00Z')                      // "Oct 27, 2025"
formatDate('2025-10-27T12:00:00Z', 'America/New_York')  // "Oct 27, 2025"
formatDate('invalid')                                   // "—"
formatDate(null)                                        // "—"
```

**Default timezone:** `America/Phoenix`

---

#### `formatDateTime(iso, timeZone?)`

Includes time in the formatted output.

```typescript
formatDateTime('2025-10-27T12:00:00Z')  // "Oct 27, 2025 at 5:00 AM"
```

---

#### `formatRelativeTime(iso)`

Displays human-readable relative time.

```typescript
formatRelativeTime(new Date().toISOString())  // "just now"
// (2 hours ago)                               // "2 hours ago"
// (3 days ago)                                // "3 days ago"
```

---

#### `formatPercent(value, normalize?)`

Formats percentages.

```typescript
formatPercent(0.75)      // "75.0%"
formatPercent(75, true)  // "75.0%"  (normalized from 0-100)
```

---

#### `formatCompactNumber(value)`

Abbreviates large numbers.

```typescript
formatCompactNumber(1500)         // "1.5K"
formatCompactNumber(1500000)      // "1.5M"
formatCompactNumber(1500000000)   // "1.5B"
```

---

### Selectors (`lib/quoteSelectors.ts`)

#### `selectCounts(quotes)`

Calculate counts for all quote statuses.

```typescript
const counts = selectCounts(quotes);
// {
//   all: 10,
//   draft: 3,
//   sent: 4,
//   accepted: 2,
//   rejected: 1,
//   expired: 0
// }
```

**Edge cases:**
- Empty array → all counts are `0`
- `undefined` input → all counts are `0`

---

#### `selectRecent(quotes, n?)`

Get the most recent quotes, sorted by `updatedAt` (falls back to `createdAt`).

```typescript
const recent = selectRecent(quotes, 5);  // Last 5 quotes
```

---

#### `displayTotal(quote)`

Compute and format the quote total. **Priority:**
1. Use `quote.total` if present
2. Compute `subtotal + tax` if both numeric
3. Use `subtotal` alone if `tax` is missing
4. Return `'—'` for invalid data

```typescript
displayTotal({ total: 1499.5 })                    // "$1,499.50"
displayTotal({ total: "1499.5" })                  // "$1,499.50"
displayTotal({ subtotal: 1000, tax: 80 })          // "$1,080.00"
displayTotal({ subtotal: "1000", tax: "80" })      // "$1,080.00"
displayTotal({ subtotal: "abc" })                  // "—"
displayTotal({ total: null, subtotal: null })      // "—"
```

**Logs warning in development** when amounts are malformed (includes `quote.id`).

---

#### `getStatusLabel(status)`

Get human-readable status labels and UI variants.

```typescript
getStatusLabel('draft')     // { text: "Not yet sent", variant: "default" }
getStatusLabel('sent')      // { text: "Awaiting response", variant: "warning" }
getStatusLabel('accepted')  // { text: "Successful quotes", variant: "success" }
getStatusLabel('rejected')  // { text: "Rejected", variant: "error" }
```

---

#### `selectTotalAcceptedValue(quotes)`

Calculate total revenue from accepted quotes.

```typescript
const totalRevenue = selectTotalAcceptedValue(quotes);  // 45000
```

Ignores invalid amounts and non-accepted quotes.

---

#### `selectByStatus(quotes, status)`

Filter quotes by status.

```typescript
const drafts = selectByStatus(quotes, 'draft');
```

---

#### `searchQuotes(quotes, query)`

Search quotes by client name, email, or notes (case-insensitive).

```typescript
const results = searchQuotes(quotes, 'john');
```

---

## Usage Example

### Dashboard Component

```typescript
import { useEffect, useState } from 'react';
import { selectCounts, selectRecent, displayTotal, getStatusLabel } from '@/lib/quoteSelectors';
import { formatDate } from '@/lib/formatters';
import type { Quote } from '@/types/quote';

export default function QuoteDashboard() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuotes() {
      try {
        setLoading(true);
        const response = await fetch('/api/quotes');
        const data = await response.json();
        setQuotes(data.quotes || []);
      } catch (err) {
        setError('Failed to load quotes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuotes();
  }, []);

  // Derived data (pure, no side effects)
  const counts = selectCounts(quotes);
  const recent = selectRecent(quotes, 5);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <ErrorBanner>
        {error}
        <button onClick={() => window.location.reload()}>Retry</button>
      </ErrorBanner>
    );
  }

  if (quotes.length === 0) {
    return (
      <EmptyState>
        <p>No quotes yet—create your first quote.</p>
        <button>Create New Quote</button>
      </EmptyState>
    );
  }

  return (
    <div>
      {/* KPI Tiles */}
      <div className="grid grid-cols-4 gap-4">
        <KPITile label="Total" sublabel="All time" value={counts.all} />
        <KPITile label="Draft" sublabel="Not yet sent" value={counts.draft} />
        <KPITile label="Sent" sublabel="Awaiting response" value={counts.sent} />
        <KPITile label="Accepted" sublabel="Successful quotes" value={counts.accepted} />
      </div>

      {/* Recent Quotes */}
      <h2>Recent Quotes</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Client</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((quote) => {
            const statusLabel = getStatusLabel(quote.status);
            return (
              <tr key={quote.id}>
                <td>{formatDate(quote.updatedAt ?? quote.createdAt)}</td>
                <td>{quote.client?.name ?? '—'}</td>
                <td>
                  <StatusChip variant={statusLabel.variant}>
                    {statusLabel.text}
                  </StatusChip>
                </td>
                <td>{displayTotal(quote)}</td>
                <td>
                  <button onClick={() => navigate(`/quotes/${quote.id}`)}>
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Error Handling Strategy

### 1. **Graceful Degradation**
All functions return safe defaults (`'—'`, `0`, `[]`) instead of throwing errors.

### 2. **Development Warnings**
Malformed data triggers `console.warn()` in development with the problematic `quote.id`:

```typescript
console.warn('[displayTotal] Invalid quote amounts:', {
  id: quote.id,
  total: quote.total,
  subtotal: quote.subtotal,
  tax: quote.tax,
});
```

### 3. **Loading States**
Show skeletons for 400–800ms minimum to avoid jank.

### 4. **Error States**
Display inline error banners with retry buttons, not full-page errors.

### 5. **Empty States**
Friendly empty states with clear CTAs: "No quotes yet—create your first quote."

---

## Test Coverage

**46 tests** covering:
- ✅ Valid inputs
- ✅ `null` and `undefined`
- ✅ `NaN`, `Infinity`, `-Infinity`
- ✅ Empty strings, non-numeric strings
- ✅ Mixed string/number types
- ✅ Empty arrays
- ✅ Timezone handling
- ✅ Edge cases in date parsing
- ✅ Sorting and filtering
- ✅ Revenue calculations

Run tests:
```bash
npm test -- formatters.test.ts quoteSelectors.test.ts
```

---

## Performance

### Caching
Selectors are pure functions. Use `useMemo` in React:

```typescript
const counts = useMemo(() => selectCounts(quotes), [quotes]);
const recent = useMemo(() => selectRecent(quotes, 5), [quotes]);
```

### Batching
All data transformations happen in a single render cycle—no intermediate states.

---

## Accessibility

- **Status chips** have `aria-label` attributes
- **KPI tiles** use semantic `<dl>` lists
- **Tables** have proper `<th>` scope attributes
- **Buttons** have accessible labels

**Target:** Lighthouse a11y score ≥ 95

---

## TypeScript Types

All types are exported from `types/quote.ts`:

```typescript
import type { Quote, QuoteStatus, QuoteCounts } from '@/types/quote';
```

---

## Deployment Checklist

- [x] Formatters handle all edge cases
- [x] Selectors are pure and defensive
- [x] Tests pass (46/46)
- [x] TypeScript types defined
- [ ] Dashboard component created
- [ ] Loading/error/empty states implemented
- [ ] API integration complete
- [ ] Lighthouse a11y score ≥ 95

---

## Support

For questions or issues, see the test files for comprehensive examples of expected behavior.
