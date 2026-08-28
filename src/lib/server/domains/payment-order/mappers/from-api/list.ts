import type { PayinOrderStatus, PayinTimelineEntry } from '$lib/types/payin';
import type {
	PaymentOrderCounts,
	PaymentOrderListItem,
	PaymentOrderTimelineItem
} from '../../schema';

const amountFormatter = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 2
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
	day: '2-digit',
	month: 'short',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	timeZone: 'Asia/Kolkata'
});

const STATUS_FILTERS: Record<PayinOrderStatus, string> = {
	created: 'CREATED',
	pending: 'INITIATED,AUTHORIZED,SUSPECTED,ATTEMPTED',
	success: 'CAPTURED',
	failed: 'FAILED,REJECTED,CANCELLED',
	expired: 'EXPIRED'
};

export interface PaymentOrderListRow extends Record<string, unknown> {
	orderId: string;
	createdAt: string;
	customer: string;
	amount: string;
	attemptId: string;
	status: PayinOrderStatus;
}

export interface PaymentOrderCardCounts {
	Orders: number;
	Successful: number;
	Pending: number;
	Created: number;
	Failed: number;
}

export interface PaymentOrderDetailView {
	orderId: string;
	clientOrderId: string;
	customerName: string;
	customerEmail: string;
	customerPhoneNumber: string;
	orderAmount: string;
	orderStatus: PayinOrderStatus;
	statusDescription: string;
	description: string;
	createdAt: string;
	expiresAt: string;
	paymentLink: string;
}

export function mapPaymentOrderApiStatus(status: string): PayinOrderStatus {
	const normalized = status.trim().toUpperCase();
	if (normalized === 'CREATED') return 'created';
	if (normalized === 'CAPTURED' || normalized === 'SUCCESS') return 'success';
	if (normalized === 'EXPIRED') return 'expired';
	if (normalized === 'FAILED' || normalized === 'REJECTED' || normalized === 'CANCELLED') {
		return 'failed';
	}
	return 'pending';
}

export function mapPaymentOrderUiStatus(status: string | undefined): string | undefined {
	if (!status) return undefined;
	if (status === 'created' || status === 'pending' || status === 'success') {
		return STATUS_FILTERS[status];
	}
	if (status === 'failed' || status === 'expired') return STATUS_FILTERS[status];
	return undefined;
}

export function mapPaymentOrderListItem(item: PaymentOrderListItem): PaymentOrderListRow {
	const createdAt = item.createdAtIst?.trim() || item.createdAt?.trim() || '';
	const customer =
		item.customerName?.trim() ||
		item.customerEmail?.trim() ||
		item.customerPhoneNumber?.trim() ||
		'—';

	return {
		orderId: item.orderId,
		createdAt: formatPaymentOrderDate(createdAt),
		customer,
		amount: formatPaymentOrderAmount(item.transactionAmount),
		attemptId: item.payinAttemptId?.trim() || '—',
		status: mapPaymentOrderApiStatus(item.status)
	};
}

export function mapPaymentOrderListResponse(items: PaymentOrderListItem[]): PaymentOrderListRow[] {
	return items.map(mapPaymentOrderListItem);
}

export function mapPaymentOrderDetail(item: PaymentOrderListItem): PaymentOrderDetailView {
	const status = mapPaymentOrderApiStatus(item.status);
	const createdAtValue = item.createdAtIst?.trim() || item.createdAt?.trim() || '';

	return {
		orderId: item.orderId,
		clientOrderId: item.clientOrderId?.trim() || '—',
		customerName: item.customerName?.trim() || '—',
		customerEmail: item.customerEmail?.trim() || '—',
		customerPhoneNumber: item.customerPhoneNumber?.trim() || '—',
		orderAmount: formatPaymentOrderAmount(item.transactionAmount),
		orderStatus: status,
		statusDescription:
			item.gatewayDescription?.trim() || item.description?.trim() || 'No status details',
		description: item.description?.trim() || '—',
		createdAt: formatPaymentOrderDate(createdAtValue),
		expiresAt: formatPaymentOrderDate(item.checkoutExpiry?.trim() || ''),
		paymentLink: item.paymentLink?.trim() || ''
	};
}

export function mapPaymentOrderTimeline(items: PaymentOrderTimelineItem[]): PayinTimelineEntry[] {
	return items
		.map(mapPaymentOrderTimelineItem)
		.sort((left, right) => left.timestampMs - right.timestampMs);
}

export function mapPaymentOrderCardCounts(counts: PaymentOrderCounts): PaymentOrderCardCounts {
	return {
		Orders: counts.totalCount,
		Successful: counts.capturedCount,
		Pending: counts.initiatedCount + counts.authorizedCount + counts.suspectedCount,
		Created: counts.createdCount,
		Failed: counts.failedCount + counts.rejectedCount + counts.cancelledCount
	};
}

export function getPaymentOrderStatusCount(
	counts: PaymentOrderCounts,
	status: string | undefined
): number {
	if (status === 'created') return counts.createdCount;
	if (status === 'pending') {
		return counts.initiatedCount + counts.authorizedCount + counts.suspectedCount;
	}
	if (status === 'success') return counts.capturedCount;
	if (status === 'failed') {
		return counts.failedCount + counts.rejectedCount + counts.cancelledCount;
	}
	if (status === 'expired') return counts.expiredCount;
	return counts.totalCount;
}

function formatPaymentOrderDate(value: string): string {
	if (!value) return '—';
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatPaymentOrderAmount(value: string): string {
	const normalized = value.replace(/,/g, '').trim();
	if (!normalized) return '—';
	const amount = Number(normalized);
	return Number.isFinite(amount) ? amountFormatter.format(amount) : value || '—';
}

function mapPaymentOrderTimelineItem(item: PaymentOrderTimelineItem): PayinTimelineEntry {
	const status = mapPaymentOrderApiStatus(item.status);
	const timestamp = Date.parse(item.createdAt);
	const refundId = item.refundId?.trim() || item.pipelineRefundId?.trim() || '';
	const amount = formatPaymentOrderAmount(item.amount ?? '');
	return {
		entryTitle: item.eventTitle,
		entryType: mapTimelineEntryType(item),
		entryDescription:
			item.eventDescription?.trim() || item.gatewayDescription?.trim() || item.status,
		txnAmount: refundId ? '' : amount,
		refundAmount: refundId ? amount : '',
		transactionStatus: status,
		paymentMethod: '',
		paymentChannel: '',
		crn: item.clientOrderId?.trim() || '',
		utr: '',
		bankRRN: '',
		cardNumber: '',
		cardType: '',
		transactionMessage: item.status,
		errorDescription: status === 'failed' ? item.gatewayDescription?.trim() || '' : '',
		refundId,
		refundSpeed: '',
		refundMode: '',
		refundType: '',
		remark: '',
		timestampMs: Number.isNaN(timestamp) ? Date.now() : timestamp,
		isCompleted: true
	};
}

function mapTimelineEntryType(item: PaymentOrderTimelineItem): PayinTimelineEntry['entryType'] {
	const status = item.status.trim().toUpperCase();
	const refundStatus = item.refundStatus?.trim().toUpperCase() || '';
	const isRefund = !!(item.refundId?.trim() || item.pipelineRefundId?.trim() || refundStatus);

	if (isRefund) {
		if (refundStatus === 'FAILED' || refundStatus === 'REJECTED' || refundStatus === 'CANCELLED') {
			return 'refund_failed';
		}
		if (
			refundStatus === 'COMPLETED' ||
			refundStatus === 'CAPTURED' ||
			refundStatus === 'SUCCESS' ||
			refundStatus === 'REFUNDED'
		) {
			return 'refund_completed';
		}
		return 'refund_initiated';
	}

	if (status === 'CREATED') return 'payment_created';
	if (status === 'INITIATED') return 'payment_initiated';
	if (status === 'AUTHORIZED') return 'payment_authorized';
	if (status === 'CAPTURED' || status === 'SUCCESS') return 'payment_completed';
	if (status === 'FAILED' || status === 'REJECTED' || status === 'CANCELLED') {
		return 'payment_failed';
	}
	return 'payment_attempted';
}
