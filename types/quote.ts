/**
 * Quote Types
 * Type definitions for the quoting system
 */

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface Quote {
  id: string;
  status: QuoteStatus;
  subtotal?: number | string | null;
  tax?: number | string | null;
  total?: number | string | null;
  currency?: 'USD' | string;
  createdAt: string; // ISO 8601
  updatedAt?: string; // ISO 8601
  client?: {
    name?: string;
    email?: string;
    company?: string;
  } | null;
  items?: QuoteItem[];
  notes?: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number | string;
  amount: number | string;
}

export interface QuoteCounts {
  all: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected?: number;
  expired?: number;
}

export interface QuoteListResponse {
  quotes: Quote[];
  total: number;
  page?: number;
  pageSize?: number;
}
