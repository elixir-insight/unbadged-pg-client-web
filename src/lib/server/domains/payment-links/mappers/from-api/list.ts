import {
	PAYMENT_LINK_STATUSES,
	type PaymentLink,
	type PaymentLinkCounts,
	type PaymentLinkStatus
} from '$lib/types/payment-link';
import { mapPaymentLinkStatus } from '$lib/utils/payment-link-map';
import type {
	PaymentLinkApiCounts,
	PaymentLinkListItem,
	PaymentLinkPagination
} from '../../schema';

const UI_TO_API_STATUSES: Partial<Record<PaymentLinkStatus, string>> = {
	issued: 'CREATED',
	attempted: 'ATTEMPTED',
	paid: 'CAPTURED',
	cancelled: 'CANCELLED',
	expired: 'EXPIRED'
};

export const PAYMENT_LINK_COUNT_TABS: {
	label: keyof PaymentLinkCounts;
	status: PaymentLinkStatus | undefined;
}[] = [
	{ label: 'All', status: undefined },
	{ label: 'Issued', status: 'issued' },
	{ label: 'Attempted', status: 'attempted' },
	{ label: 'Paid', status: 'paid' },
	{ label: 'Cancelled', status: 'cancelled' },
	{ label: 'Expired', status: 'expired' }
];

export function mapPaymentLinkUiStatus(status: string | undefined): string | undefined {
	if (!status) return undefined;
	if (PAYMENT_LINK_STATUSES.some((value) => value === status)) {
		return UI_TO_API_STATUSES[status as PaymentLinkStatus];
	}
	return undefined;
}

export function emptyPaymentLinkPagination(limit: number, page: number): PaymentLinkPagination {
	return { limit, page, total: 0 };
}

export function emptyPaymentLinkCounts(): PaymentLinkCounts {
	return {
		All: 0,
		Issued: 0,
		Attempted: 0,
		Paid: 0,
		Cancelled: 0,
		Expired: 0
	};
}

export function mapPaymentLinkCardCounts(counts: PaymentLinkApiCounts): PaymentLinkCounts {
	const created = counts.created ?? 0;
	const attempted = counts.attempted ?? 0;
	const captured = counts.captured ?? 0;
	const cancelled = counts.cancelled ?? 0;
	const expired = counts.expired ?? 0;
	const suspected = counts.suspected ?? 0;

	return {
		All: created + attempted + captured + cancelled + expired + suspected,
		Issued: created,
		Attempted: attempted,
		Paid: captured,
		Cancelled: cancelled,
		Expired: expired
	};
}

export function mapPaymentLinkListItem(item: PaymentLinkListItem): PaymentLink | null {
	const orderId = item.orderId?.trim() ?? '';
	if (!orderId) return null;

	const createdAt = item.createdAt?.trim() ?? '';
	const createdAtMs = createdAt ? Date.parse(createdAt) : Number.NaN;
	const amount = parseAmountValue(item.amount);
	const status = mapPaymentLinkStatus(item.status);
	const expiry = item.Expiry?.trim() || item.expiry?.trim() || '';
	const customerEmail = item.customer?.email?.trim() || null;
	const customerPhone = item.customer?.phoneNumber?.trim() || null;

	return {
		id: orderId,
		createdAt: createdAt || new Date(0).toISOString(),
		createdAtMs: Number.isNaN(createdAtMs) ? 0 : createdAtMs,
		amount,
		amountPaid: status === 'paid' ? amount : 0,
		paymentFor: item.description?.trim() || '—',
		paymentLinkUrl: item.paymentLink?.trim() ?? '',
		status,
		receiptNo: item.referenceId?.trim() || null,
		partialPaymentEnabled: status === 'partially_paid',
		expiresOn: expiry || null,
		customerEmail,
		customerPhone,
		transactionId: item.attemptId?.trim() || null,
		createdBy: '—'
	};
}

export function mapPaymentLinkListResponse(items: PaymentLinkListItem[]): PaymentLink[] {
	return items.map(mapPaymentLinkListItem).filter((link): link is PaymentLink => link !== null);
}

function parseAmountValue(value: string | null | undefined): number {
	const amount = Number((value ?? '').replace(/,/g, '').trim());
	return Number.isFinite(amount) ? amount : 0;
}
