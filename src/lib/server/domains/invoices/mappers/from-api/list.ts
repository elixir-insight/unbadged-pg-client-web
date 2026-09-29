import {
	INVOICE_STATUSES,
	type Invoice,
	type InvoiceCounts,
	type InvoiceLineItem,
	type InvoiceStatus
} from '$lib/types/invoice';
import {
	PAYMENT_LINK_ALLOWED_METHODS,
	type PaymentLinkAllowedMethod
} from '$lib/types/payment-link';
import type { InvoiceApiCounts, InvoiceListItem, InvoicePagination } from '../../schema';

const UI_TO_API_STATUSES: Partial<Record<InvoiceStatus, string>> = {
	issued: 'CREATED',
	attempted: 'ATTEMPTED',
	overdue: 'CREATED',
	paid: 'CAPTURED',
	cancelled: 'CANCELLED',
	expired: 'EXPIRED'
};

export const INVOICE_COUNT_TABS: {
	label: keyof InvoiceCounts;
	status: InvoiceStatus | undefined;
}[] = [
	{ label: 'All', status: undefined },
	{ label: 'Issued', status: 'issued' },
	{ label: 'Attempted', status: 'attempted' },
	{ label: 'Overdue', status: 'overdue' },
	{ label: 'Paid', status: 'paid' },
	{ label: 'Cancelled', status: 'cancelled' },
	{ label: 'Expired', status: 'expired' }
];

export function mapInvoiceUiStatus(status: string | undefined): string | undefined {
	if (!status) return undefined;
	if (INVOICE_STATUSES.some((value) => value === status)) {
		return UI_TO_API_STATUSES[status as InvoiceStatus];
	}
	return undefined;
}

export function emptyInvoicePagination(limit: number, page: number): InvoicePagination {
	return { limit, page, total: 0 };
}

export function emptyInvoiceCounts(): InvoiceCounts {
	return {
		All: 0,
		Issued: 0,
		Attempted: 0,
		Overdue: 0,
		Paid: 0,
		Cancelled: 0,
		Expired: 0
	};
}

export function mapInvoiceCardCounts(counts: InvoiceApiCounts): InvoiceCounts {
	const created = counts.createdCount ?? 0;
	const initiated = counts.initiatedCount ?? 0;
	const authorized = counts.authorizedCount ?? 0;
	const captured = counts.capturedCount ?? 0;
	const cancelled = counts.cancelledCount ?? 0;
	const expired = counts.expiredCount ?? 0;
	const total = counts.totalCount ?? 0;

	return {
		All: total,
		Issued: created,
		Attempted: initiated + authorized,
		Overdue: 0,
		Paid: captured,
		Cancelled: cancelled,
		Expired: expired
	};
}

export function mapInvoiceStatus(
	value: string | null | undefined,
	checkoutExpiry: string | null | undefined
): InvoiceStatus {
	const normalized = (value ?? '').trim().toLowerCase().replace(/[\s-]/g, '_');

	if (normalized === 'created' || normalized === 'active' || normalized === 'pending') {
		if (isPastExpiry(checkoutExpiry)) return 'overdue';
		return 'issued';
	}
	if (
		normalized === 'attempted' ||
		normalized === 'initiated' ||
		normalized === 'authorized' ||
		normalized === 'suspected'
	) {
		return 'attempted';
	}
	if (normalized === 'captured' || normalized === 'paid' || normalized === 'success') {
		return 'paid';
	}
	if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled';
	if (normalized === 'expired') return 'expired';
	if (INVOICE_STATUSES.some((status) => status === normalized)) {
		return normalized as InvoiceStatus;
	}
	if (isPastExpiry(checkoutExpiry)) return 'overdue';
	return 'issued';
}

export function mapInvoiceListItem(item: InvoiceListItem): Invoice | null {
	const orderId = item.orderId?.trim() ?? '';
	const clientOrderId = item.clientOrderId?.trim() ?? '';
	const id = clientOrderId || orderId;
	if (!id) return null;

	const createdAt = item.createdAt?.trim() || item.createdAtIst?.trim() || '';
	const createdAtMs = createdAt ? Date.parse(createdAt) : Number.NaN;
	const amount = parseAmountValue(item.transactionAmount);
	const checkoutExpiry = item.checkoutExpiry?.trim() || '';
	const status = mapInvoiceStatus(item.status, checkoutExpiry);
	const invoice = item.invoice;
	const referenceId = invoice?.referenceId?.trim() || '';
	const description = invoice?.description?.trim() || item.description?.trim() || '—';
	const customerAddress =
		invoice?.customerAddress?.trim() ||
		[invoice?.customerCity, invoice?.customerCountry, invoice?.customerZipCode]
			.map((part) => part?.trim())
			.filter(Boolean)
			.join(', ');
	const payinAttemptId = item.payinAttemptId?.trim() || '';
	const transactionId = payinAttemptId && payinAttemptId !== 'PAT_0' ? payinAttemptId : null;
	const deliveryMethods = invoice?.deliveryMethods ?? [];

	return {
		id,
		invoiceNumber: referenceId || clientOrderId || orderId,
		createdAt: createdAt || new Date(0).toISOString(),
		createdAtMs: Number.isNaN(createdAtMs) ? 0 : createdAtMs,
		amount,
		description,
		items: mapInvoiceItems(invoice?.items ?? []),
		status,
		receiptNo: referenceId || clientOrderId || orderId,
		dueDate: checkoutExpiry || '',
		customerName: item.customerName?.trim() || '—',
		customerEmail: item.customerEmail?.trim() || '',
		customerPhone: item.customerPhoneNumber?.trim() || '',
		customerAddress,
		paymentLinkUrl: item.paymentLink?.trim() || null,
		allowedPaymentMethods: mapAllowedMethods(item.allowedPaymentMethods ?? []),
		notifyEmail: deliveryMethods.some((method) => method.trim().toUpperCase() === 'EMAIL'),
		notifySms: deliveryMethods.some((method) => method.trim().toUpperCase() === 'SMS'),
		transactionId,
		createdBy: invoice?.merchantName?.trim() || '—'
	};
}

export function mapInvoiceListResponse(items: InvoiceListItem[]): Invoice[] {
	return items.map(mapInvoiceListItem).filter((invoice): invoice is Invoice => invoice !== null);
}

function mapInvoiceItems(
	items: NonNullable<NonNullable<InvoiceListItem['invoice']>['items']>
): InvoiceLineItem[] {
	return items.map((item, index) => {
		const amount = parseAmountValue(item.price);
		const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
		return {
			id: `item_${index + 1}`,
			name: item.itemName?.trim() || 'Item',
			description: '',
			amount,
			quantity,
			taxPercent: 0
		};
	});
}

function mapAllowedMethods(methods: string[]): PaymentLinkAllowedMethod[] {
	return methods.filter((method): method is PaymentLinkAllowedMethod =>
		PAYMENT_LINK_ALLOWED_METHODS.some((allowed) => allowed === method)
	);
}

function parseAmountValue(value: string | null | undefined): number {
	const amount = Number((value ?? '').replace(/,/g, '').trim());
	return Number.isFinite(amount) ? amount : 0;
}

function isPastExpiry(checkoutExpiry: string | null | undefined): boolean {
	const expiry = checkoutExpiry?.trim();
	if (!expiry) return false;
	const expiryMs = Date.parse(expiry);
	if (Number.isNaN(expiryMs)) return false;
	return expiryMs < Date.now();
}
