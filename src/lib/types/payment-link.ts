export const PAYMENT_LINK_STATUSES = [
	'issued',
	'partially_paid',
	'paid',
	'cancelled',
	'expired'
] as const;

export type PaymentLinkStatus = (typeof PAYMENT_LINK_STATUSES)[number];

export const PAYMENT_LINK_ALLOWED_METHODS = ['UPI', 'CARD', 'NETBANKING'] as const;

export type PaymentLinkAllowedMethod = (typeof PAYMENT_LINK_ALLOWED_METHODS)[number];

export const PAYMENT_LINK_METHOD_OPTIONS: {
	value: PaymentLinkAllowedMethod;
	label: string;
}[] = [
	{ value: 'UPI', label: 'UPI' },
	{ value: 'CARD', label: 'Card' },
	{ value: 'NETBANKING', label: 'Net Banking' }
];

export interface PaymentLink {
	id: string;
	createdAt: string;
	createdAtMs: number;
	amount: number;
	amountPaid: number;
	paymentFor: string;
	paymentLinkUrl: string;
	status: PaymentLinkStatus;
	receiptNo: string | null;
	partialPaymentEnabled: boolean;
	expiresOn: string | null;
	customerEmail: string | null;
	customerPhone: string | null;
	transactionId: string | null;
	createdBy: string;
}

export type PaymentLinkListRow = PaymentLink & Record<string, unknown>;

export interface PaymentLinkCounts {
	All: number;
	Issued: number;
	'Partially Paid': number;
	Paid: number;
	Cancelled: number;
	Expired: number;
}

export interface PaymentLinkFilterQuery {
	statusTab: keyof PaymentLinkCounts | null;
	search: string;
	fromDateMs: number | null;
	toDateMs: number | null;
}
