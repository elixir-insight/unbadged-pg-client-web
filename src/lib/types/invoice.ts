import type { PaymentLinkAllowedMethod } from '$lib/types/payment-link';

export const INVOICE_STATUSES = [
	'issued',
	'attempted',
	'overdue',
	'paid',
	'cancelled',
	'expired'
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface InvoiceIssuer {
	brandName: string;
	companyName: string;
	gstin: string;
	location: string;
	address: string;
	phone: string;
}

export interface InvoiceLineItem {
	id: string;
	name: string;
	description: string;
	amount: number;
	taxPercent: number;
}

export interface Invoice {
	id: string;
	invoiceNumber: string;
	createdAt: string;
	createdAtMs: number;
	amount: number;
	description: string;
	items?: InvoiceLineItem[];
	status: InvoiceStatus;
	receiptNo: string;
	dueDate: string;
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	paymentLinkUrl: string | null;
	allowedPaymentMethods: PaymentLinkAllowedMethod[];
	notifyEmail: boolean;
	notifySms: boolean;
	transactionId: string | null;
	createdBy: string;
}

export type InvoiceListRow = Invoice & Record<string, unknown>;

export interface InvoiceCounts {
	All: number;
	Issued: number;
	Attempted: number;
	Overdue: number;
	Paid: number;
	Cancelled: number;
	Expired: number;
}

export type InvoiceSearchField = 'id' | 'receiptNo' | 'customerPhone' | 'customerEmail';

export interface InvoiceFilterQuery {
	statusTab: keyof InvoiceCounts | null;
	search: string;
	searchField: InvoiceSearchField;
	fromDateMs: number | null;
	toDateMs: number | null;
}
