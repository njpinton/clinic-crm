import { ApiError } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  status: string;
}

export interface Invoice {
  id: string;
  appointment: string;
  invoice_number: string;
  issue_date: string;
  status: 'draft' | 'issued' | 'paid' | 'void' | 'partially_paid';
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  items: InvoiceItem[];
  payments: Payment[];
}

export async function getInvoiceByAppointment(
  appointmentId: string,
  token: string
): Promise<Invoice | null> {
  const response = await fetch(`${API_BASE_URL}/api/billing/invoices/?appointment=${appointmentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch invoice: ${response.statusText}`,
      response.status,
      await response.json().catch(() => ({}))
    );
  }

  const data = await response.json();
  const results = Array.isArray(data) ? data : data.results;
  return results.length > 0 ? results[0] : null;
}

export async function createInvoice(
  payload: { appointment: string; patient: string },
  token: string
): Promise<Invoice> {
  const response = await fetch(`${API_BASE_URL}/api/billing/invoices/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ ...payload, invoice_number: `INV-${Date.now()}` }), // Simple ID gen
  });

  if (!response.ok) {
    throw new ApiError(
      `Failed to create invoice: ${response.statusText}`,
      response.status,
      await response.json().catch(() => ({}))
    );
  }

  return response.json();
}

export async function addItemToInvoice(
  invoiceId: string,
  item: Omit<InvoiceItem, 'id' | 'amount'>,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/billing/invoice-items/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ ...item, invoice: invoiceId }),
  });

  if (!response.ok) {
    throw new ApiError(
      `Failed to add item: ${response.statusText}`,
      response.status,
      await response.json().catch(() => ({}))
    );
  }
}

export async function recordPayment(
  invoiceId: string,
  payment: { amount: number; payment_method: string; reference_number?: string },
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/billing/payments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ ...payment, invoice: invoiceId }),
  });

  if (!response.ok) {
    throw new ApiError(
      `Failed to record payment: ${response.statusText}`,
      response.status,
      await response.json().catch(() => ({}))
    );
  }
}
