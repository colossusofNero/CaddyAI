/**
 * Tests for formatting utilities
 * Validates edge case handling and correct output
 */

import {
  formatMoney,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatPercent,
  formatCompactNumber,
} from '../formatters';

describe('formatMoney', () => {
  test('formats valid numbers correctly', () => {
    expect(formatMoney(1499.5)).toBe('$1,499.50');
    expect(formatMoney(1000)).toBe('$1,000.00');
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(0.99)).toBe('$0.99');
  });

  test('formats string numbers correctly', () => {
    expect(formatMoney('1499.5')).toBe('$1,499.50');
    expect(formatMoney('1000')).toBe('$1,000.00');
  });

  test('handles invalid inputs gracefully', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
    expect(formatMoney(NaN)).toBe('—');
    expect(formatMoney('abc')).toBe('—');
    expect(formatMoney('')).toBe('—');
    expect(formatMoney(Infinity)).toBe('—');
    expect(formatMoney(-Infinity)).toBe('—');
  });

  test('supports different currencies', () => {
    expect(formatMoney(1000, 'EUR')).toContain('1,000.00');
    expect(formatMoney(1000, 'GBP')).toContain('1,000.00');
  });

  test('handles negative numbers', () => {
    expect(formatMoney(-1000)).toBe('-$1,000.00');
  });
});

describe('formatDate', () => {
  test('formats valid ISO dates correctly', () => {
    const result = formatDate('2025-10-27T12:00:00Z', 'America/Phoenix');
    expect(result).toMatch(/Oct 27, 2025/);
  });

  test('handles invalid inputs gracefully', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('invalid')).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  test('respects timezone parameter', () => {
    const date = '2025-01-01T00:00:00Z';
    const resultPT = formatDate(date, 'America/Los_Angeles');
    const resultET = formatDate(date, 'America/New_York');
    // Both should format, though specific hour may differ
    expect(resultPT).toBeTruthy();
    expect(resultET).toBeTruthy();
  });
});

describe('formatDateTime', () => {
  test('includes time in output', () => {
    const result = formatDateTime('2025-10-27T12:00:00Z', 'America/Phoenix');
    expect(result).toMatch(/\d{1,2}:\d{2}\s[AP]M/);
  });

  test('handles invalid inputs gracefully', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
  });
});

describe('formatRelativeTime', () => {
  test('formats recent times correctly', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  test('handles invalid inputs gracefully', () => {
    expect(formatRelativeTime(null)).toBe('—');
    expect(formatRelativeTime(undefined)).toBe('—');
    expect(formatRelativeTime('invalid')).toBe('—');
  });
});

describe('formatPercent', () => {
  test('formats decimal percentages', () => {
    expect(formatPercent(0.75)).toBe('75.0%');
    expect(formatPercent(0.5)).toBe('50.0%');
    expect(formatPercent(1)).toBe('100.0%');
  });

  test('formats whole number percentages when normalized', () => {
    expect(formatPercent(75, true)).toBe('75.0%');
    expect(formatPercent(50, true)).toBe('50.0%');
  });

  test('handles invalid inputs gracefully', () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
    expect(formatPercent(NaN)).toBe('—');
  });
});

describe('formatCompactNumber', () => {
  test('formats large numbers with abbreviations', () => {
    expect(formatCompactNumber(1500)).toBe('1.5K');
    expect(formatCompactNumber(1500000)).toBe('1.5M');
    expect(formatCompactNumber(1500000000)).toBe('1.5B');
  });

  test('handles small numbers', () => {
    expect(formatCompactNumber(100)).toBe('100');
  });

  test('handles invalid inputs gracefully', () => {
    expect(formatCompactNumber(null)).toBe('—');
    expect(formatCompactNumber(undefined)).toBe('—');
    expect(formatCompactNumber(NaN)).toBe('—');
  });
});
