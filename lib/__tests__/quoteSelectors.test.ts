/**
 * Tests for quote selectors
 * Validates selector logic and edge case handling
 */

import type { Quote } from '@/types/quote';
import {
  selectCounts,
  selectRecent,
  displayTotal,
  getStatusLabel,
  selectTotalAcceptedValue,
  selectByStatus,
  searchQuotes,
} from '../quoteSelectors';

// Test fixtures
const mockQuotes: Quote[] = [
  {
    id: '1',
    status: 'draft',
    total: 1000,
    createdAt: '2025-10-01T10:00:00Z',
  },
  {
    id: '2',
    status: 'sent',
    total: 2000,
    createdAt: '2025-10-05T10:00:00Z',
    updatedAt: '2025-10-10T10:00:00Z',
  },
  {
    id: '3',
    status: 'accepted',
    total: 3000,
    createdAt: '2025-10-15T10:00:00Z',
  },
  {
    id: '4',
    status: 'accepted',
    subtotal: 1500,
    tax: 150,
    createdAt: '2025-10-20T10:00:00Z',
  },
];

describe('selectCounts', () => {
  test('counts quotes by status correctly', () => {
    const counts = selectCounts(mockQuotes);
    expect(counts).toEqual({
      all: 4,
      draft: 1,
      sent: 1,
      accepted: 2,
      rejected: 0,
      expired: 0,
    });
  });

  test('handles empty array', () => {
    const counts = selectCounts([]);
    expect(counts).toEqual({
      all: 0,
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
    });
  });

  test('handles undefined input', () => {
    const counts = selectCounts(undefined);
    expect(counts).toEqual({
      all: 0,
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
    });
  });
});

describe('selectRecent', () => {
  test('returns most recent quotes', () => {
    const recent = selectRecent(mockQuotes, 2);
    expect(recent).toHaveLength(2);
    expect(recent[0].id).toBe('4'); // Most recent
    expect(recent[1].id).toBe('3');
  });

  test('uses updatedAt when available', () => {
    const recent = selectRecent(mockQuotes, 5);
    expect(recent[0].id).toBe('4'); // 2025-10-20
    expect(recent[1].id).toBe('3'); // 2025-10-15
    expect(recent[2].id).toBe('2'); // 2025-10-10 (updatedAt)
  });

  test('handles empty array', () => {
    const recent = selectRecent([]);
    expect(recent).toEqual([]);
  });

  test('handles undefined input', () => {
    const recent = selectRecent(undefined);
    expect(recent).toEqual([]);
  });

  test('limits results to n', () => {
    const recent = selectRecent(mockQuotes, 2);
    expect(recent).toHaveLength(2);
  });
});

describe('displayTotal', () => {
  test('uses total when available', () => {
    const quote: Quote = {
      id: '1',
      status: 'draft',
      total: 1499.5,
      createdAt: '2025-10-01T10:00:00Z',
    };
    expect(displayTotal(quote)).toBe('$1,499.50');
  });

  test('parses string total', () => {
    const quote: Quote = {
      id: '1',
      status: 'draft',
      total: '1499.5',
      createdAt: '2025-10-01T10:00:00Z',
    };
    expect(displayTotal(quote)).toBe('$1,499.50');
  });

  test('computes from subtotal + tax when total missing', () => {
    const quote: Quote = {
      id: '1',
      status: 'draft',
      subtotal: 1000,
      tax: 80,
      createdAt: '2025-10-01T10:00:00Z',
    };
    expect(displayTotal(quote)).toBe('$1,080.00');
  });

  test('handles string subtotal and tax', () => {
    const quote: Quote = {
      id: '1',
      status: 'draft',
      subtotal: '1000',
      tax: '80',
      createdAt: '2025-10-01T10:00:00Z',
    };
    expect(displayTotal(quote)).toBe('$1,080.00');
  });

  test('uses subtotal alone when tax missing', () => {
    const quote: Quote = {
      id: '1',
      status: 'draft',
      subtotal: 1000,
      createdAt: '2025-10-01T10:00:00Z',
    };
    expect(displayTotal(quote)).toBe('$1,000.00');
  });

  test('returns — for invalid values', () => {
    const quote1: Quote = {
      id: '1',
      status: 'draft',
      total: null,
      subtotal: 'abc',
      createdAt: '2025-10-01T10:00:00Z',
    };
    expect(displayTotal(quote1)).toBe('—');

    const quote2: Quote = {
      id: '2',
      status: 'draft',
      total: NaN,
      createdAt: '2025-10-01T10:00:00Z',
    };
    expect(displayTotal(quote2)).toBe('—');
  });

  test('handles null quote', () => {
    expect(displayTotal(null)).toBe('—');
    expect(displayTotal(undefined)).toBe('—');
  });

  test('respects currency parameter', () => {
    const quote: Quote = {
      id: '1',
      status: 'draft',
      total: 1000,
      currency: 'USD',
      createdAt: '2025-10-01T10:00:00Z',
    };
    const result = displayTotal(quote);
    expect(result).toContain('$');
  });
});

describe('getStatusLabel', () => {
  test('returns correct labels', () => {
    expect(getStatusLabel('draft')).toEqual({
      text: 'Not yet sent',
      variant: 'default',
    });
    expect(getStatusLabel('sent')).toEqual({
      text: 'Awaiting response',
      variant: 'warning',
    });
    expect(getStatusLabel('accepted')).toEqual({
      text: 'Successful quotes',
      variant: 'success',
    });
    expect(getStatusLabel('rejected')).toEqual({
      text: 'Rejected',
      variant: 'error',
    });
  });
});

describe('selectTotalAcceptedValue', () => {
  test('calculates total accepted value', () => {
    const total = selectTotalAcceptedValue(mockQuotes);
    // Quote 3: 3000, Quote 4: 1500 + 150 = 1650
    expect(total).toBe(4650);
  });

  test('handles empty array', () => {
    expect(selectTotalAcceptedValue([])).toBe(0);
  });

  test('ignores invalid amounts', () => {
    const quotes: Quote[] = [
      {
        id: '1',
        status: 'accepted',
        total: 1000,
        createdAt: '2025-10-01T10:00:00Z',
      },
      {
        id: '2',
        status: 'accepted',
        total: 'invalid',
        subtotal: 'abc',
        createdAt: '2025-10-02T10:00:00Z',
      },
    ];
    expect(selectTotalAcceptedValue(quotes)).toBe(1000);
  });
});

describe('selectByStatus', () => {
  test('filters by status', () => {
    const drafts = selectByStatus(mockQuotes, 'draft');
    expect(drafts).toHaveLength(1);
    expect(drafts[0].status).toBe('draft');

    const accepted = selectByStatus(mockQuotes, 'accepted');
    expect(accepted).toHaveLength(2);
  });

  test('handles empty array', () => {
    expect(selectByStatus([], 'draft')).toEqual([]);
  });
});

describe('searchQuotes', () => {
  const quotesWithClient: Quote[] = [
    {
      id: '1',
      status: 'draft',
      total: 1000,
      client: { name: 'John Doe', email: 'john@example.com' },
      createdAt: '2025-10-01T10:00:00Z',
    },
    {
      id: '2',
      status: 'sent',
      total: 2000,
      client: { name: 'Jane Smith', email: 'jane@example.com' },
      notes: 'Urgent project',
      createdAt: '2025-10-02T10:00:00Z',
    },
  ];

  test('searches by client name', () => {
    const results = searchQuotes(quotesWithClient, 'john');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  test('searches by email', () => {
    const results = searchQuotes(quotesWithClient, 'jane@example.com');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('2');
  });

  test('searches by notes', () => {
    const results = searchQuotes(quotesWithClient, 'urgent');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('2');
  });

  test('is case insensitive', () => {
    const results = searchQuotes(quotesWithClient, 'JOHN');
    expect(results).toHaveLength(1);
  });

  test('returns all quotes for empty query', () => {
    const results = searchQuotes(quotesWithClient, '');
    expect(results).toHaveLength(2);
  });

  test('handles empty array', () => {
    expect(searchQuotes([], 'test')).toEqual([]);
  });
});
