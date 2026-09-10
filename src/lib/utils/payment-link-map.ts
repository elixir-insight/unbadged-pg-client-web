import type { CreatePaymentLinkResponse } from '$lib/api/payment-links';
import {
	PAYMENT_LINK_STATUSES,
	type PaymentLink,
	type PaymentLinkStatus
} from '$lib/types/payment-link';

function parseAmountValue(value: string): number {
	const amount = Number(value.replace(/,/g, '').trim());
	return Number.isFinite(amount) ? amount : 0;
}

function isMappedPaymentLinkStatus(value: string): value is PaymentLinkStatus {
	return PAYMENT_LINK_STATUSES.some((status) => status === value);
}

export function mapPaymentLinkStatus(value: string | null | undefined): PaymentLinkStatus {
	const normalized = (value ?? '').trim().toLowerCase().replace(/[\s-]/g, '_');
	if (isMappedPaymentLinkStatus(normalized)) return normalized;
	if (normalized === 'created' || normalized === 'active' || normalized === 'pending') {
		return 'issued';
	}
	if (normalized === 'captured' || normalized === 'success') return 'paid';
	if (normalized === 'canceled') return 'cancelled';
	if (normalized === 'partial') return 'partially_paid';
	return 'issued';
}

export function isPaymentLinkCancellable(status: PaymentLinkStatus): boolean {
	return status === 'issued' || status === 'attempted';
}

export function mapCreatedPaymentLink(params: {
	response: CreatePaymentLinkResponse;
	paymentFor: string;
	receipt: string;
	expiresBy: string | null;
	createdBy: string;
	customerEmail?: string | null;
	customerPhone?: string | null;
}): PaymentLink {
	const now = new Date();
	const expiresOn = params.expiresBy ? new Date(params.expiresBy) : null;

	return {
		id: params.response.orderId,
		createdAt: now.toISOString(),
		createdAtMs: now.getTime(),
		amount: parseAmountValue(params.response.amount || '0'),
		amountPaid: 0,
		paymentFor: params.paymentFor.trim(),
		paymentLinkUrl: params.response.checkoutUrl,
		status: mapPaymentLinkStatus(params.response.status),
		receiptNo: params.response.clientOrderId.trim() || params.receipt.trim() || null,
		partialPaymentEnabled: false,
		expiresOn: expiresOn && !Number.isNaN(expiresOn.getTime()) ? expiresOn.toISOString() : null,
		customerEmail: params.customerEmail?.trim() || null,
		customerPhone: params.customerPhone?.trim() || null,
		transactionId: null,
		createdBy: params.createdBy
	};
}
