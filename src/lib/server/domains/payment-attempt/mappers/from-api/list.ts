import type { PayinPaymentStatus, PayinRefundDetail, PayinRefundStatus } from '$lib/types/payin';
import { formatSnakeCaseLabel, truncateText } from '$lib/utils/format-display';
import type { PaymentAttemptCounts, PaymentAttemptItem, PaymentRefundItem } from '../../schema';

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

const STATUS_FILTERS: Record<'success' | 'pending' | 'failed', string> = {
	success: 'CAPTURED',
	pending: 'CREATED,INITIATED,AUTHORIZED,SUSPECTED',
	failed: 'FAILED,REJECTED,CANCELLED,EXPIRED'
};

export interface PaymentAttemptListRow extends Record<string, unknown> {
	txnId: string;
	orderId: string;
	createdAt: string;
	customer: string;
	paymentMethod: string;
	paymentChannel: string;
	amount: string;
	status: PayinPaymentStatus;
}

export interface RelatedPaymentAttempt {
	txnId: string;
	attemptNumber: number;
	paymentMethod: string;
	paymentStatus: PayinPaymentStatus;
}

export interface PaymentAttemptCardCounts {
	Payments: number;
	Successful: number;
	Pending: number;
	Refunds: number;
	Failed: number;
}

export interface PaymentAttemptDetailView {
	txnId: string;
	orderId: string;
	clientOrderId: string;
	orgId: string;
	pipelineTransactionId: string;
	disputeId: string;
	disputeStatus: string;
	transactionAmount: string;
	amountValue: string;
	paymentMethod: string;
	paymentChannel: string;
	paymentMode: string;
	paymentStatus: PayinPaymentStatus;
	statusDescription: string;
	createdAt: string;
	payerVpa: string;
	payeeVpa: string;
	bankPipelineCode: string;
	utr: string;
	bankRrn: string;
	settlementId: string;
	processingFee: string;
	gatewayFee: string;
	gatewayGst: string;
	partnerFee: string;
	partnerGst: string;
	refundableAmount: string;
}

export function mapPaymentAttemptApiStatus(status: string): PayinPaymentStatus {
	const normalized = status.trim().toUpperCase();
	if (normalized === 'CAPTURED' || normalized === 'SUCCESS') return 'success';
	if (normalized === 'AUTHORIZED') return 'authorized';
	if (
		normalized === 'FAILED' ||
		normalized === 'REJECTED' ||
		normalized === 'CANCELLED' ||
		normalized === 'EXPIRED'
	) {
		return 'failed';
	}
	return 'pending';
}

export function mapPaymentAttemptUiStatus(status: string | undefined): string | undefined {
	if (status === 'success' || status === 'pending' || status === 'failed') {
		return STATUS_FILTERS[status];
	}
	return undefined;
}

export function mapPaymentAttemptListItem(item: PaymentAttemptItem): PaymentAttemptListRow {
	const customer = item.payerVpa?.trim() || item.clientOrderId?.trim() || '—';

	return {
		txnId: item.payinAttemptId,
		orderId: item.orderId?.trim() || '—',
		createdAt: formatDate(item.createdAtIst?.trim() || item.createdAt?.trim() || ''),
		customer: truncateText(customer),
		paymentMethod: formatSnakeCaseLabel(item.paymentMethod?.trim() || '—'),
		paymentChannel: formatSnakeCaseLabel(
			item.paymentChannel?.trim() || item.paymentMode?.trim() || '—'
		),
		amount: formatAmount(item.transactionAmount),
		status: mapPaymentAttemptApiStatus(item.transactionStatus)
	};
}

export function mapPaymentAttemptListResponse(
	items: PaymentAttemptItem[]
): PaymentAttemptListRow[] {
	return items.map(mapPaymentAttemptListItem);
}

export function mapRelatedPaymentAttempts(items: PaymentAttemptItem[]): RelatedPaymentAttempt[] {
	return items.map((item, index) => ({
		txnId: item.payinAttemptId,
		attemptNumber: index + 1,
		paymentMethod: formatSnakeCaseLabel(item.paymentMethod?.trim() || '—'),
		paymentStatus: mapPaymentAttemptApiStatus(item.transactionStatus)
	}));
}

export function mapPaymentAttemptCardCounts(
	counts: PaymentAttemptCounts
): PaymentAttemptCardCounts {
	return {
		Payments: counts.totalCount,
		Successful: counts.capturedCount,
		Pending:
			counts.createdCount + counts.initiatedCount + counts.authorizedCount + counts.suspectedCount,
		Refunds: counts.refundInitiatedCount,
		Failed: counts.failedCount + counts.rejectedCount + counts.cancelledCount + counts.expiredCount
	};
}

export function mapPaymentAttemptDetail(item: PaymentAttemptItem): PaymentAttemptDetailView {
	const status = mapPaymentAttemptApiStatus(item.transactionStatus);
	const createdAtValue = item.createdAtIst?.trim() || item.createdAt?.trim() || '';

	return {
		txnId: item.payinAttemptId,
		orderId: item.orderId?.trim() || '—',
		clientOrderId: item.clientOrderId?.trim() || '—',
		orgId: item.orgId?.trim() || '',
		pipelineTransactionId: item.pipelineTransactionId?.trim() || item.payinAttemptId,
		disputeId: item.disputeId?.trim() || '',
		disputeStatus: item.disputeStatus?.trim() || '',
		transactionAmount: formatAmount(item.transactionAmount),
		amountValue: formatApiAmount(item.transactionAmount),
		paymentMethod: formatSnakeCaseLabel(item.paymentMethod?.trim() || '—'),
		paymentChannel: formatSnakeCaseLabel(item.paymentChannel?.trim() || '—'),
		paymentMode: formatSnakeCaseLabel(item.paymentMode?.trim() || '—'),
		paymentStatus: status,
		statusDescription:
			item.statusDescription?.trim() || item.gatewayDescription?.trim() || 'No status details',
		createdAt: formatDate(createdAtValue),
		payerVpa: item.payerVpa?.trim() || '',
		payeeVpa: item.payeeVpa?.trim() || '',
		bankPipelineCode: item.bankPipelineCode?.trim() || '—',
		utr: item.utrNo?.trim() || '',
		bankRrn: item.bankRrn?.trim() || '',
		settlementId: item.settlementId?.trim() || '',
		processingFee: formatAmount(item.processingFee),
		gatewayFee: formatAmount(item.gatewayFee),
		gatewayGst: formatAmount(item.gatewayGst),
		partnerFee: formatAmount(item.partnerFee),
		partnerGst: formatAmount(item.partnerGst),
		refundableAmount: formatAmount(item.refundableAmount)
	};
}

export function mapPaymentRefund(item: PaymentRefundItem): PayinRefundDetail {
	return {
		refundId: item.refundId,
		txnId: item.payinAttemptId,
		orderId: item.orderId?.trim() || '',
		customerName: item.initiatedByName?.trim() || '',
		originalAmount: formatAmount(item.txnAmount),
		refundAmount: formatAmount(item.refundAmount),
		refundStatus: mapRefundStatus(item.refundStatus),
		refundType: item.refundType?.trim().toUpperCase() === 'PARTIAL' ? 'partial' : 'full',
		refundSpeed: item.processingSpeed?.trim() || '—',
		refundMode: item.refundCategory?.trim() || '—',
		remark: item.refundReason?.trim() || item.statusDescription?.trim() || '—',
		createdAt: formatDate(item.createdAtIst?.trim() || item.createdAt?.trim() || ''),
		refundTimeline: []
	};
}

export function mapPaymentRefunds(items: PaymentRefundItem[]): PayinRefundDetail[] {
	return items.map(mapPaymentRefund);
}

function mapRefundStatus(status: string): PayinRefundStatus {
	const normalized = status.trim().toUpperCase();
	if (
		normalized === 'COMPLETED' ||
		normalized === 'CAPTURED' ||
		normalized === 'SUCCESS' ||
		normalized === 'REFUNDED'
	) {
		return 'completed';
	}
	if (normalized === 'FAILED' || normalized === 'REJECTED' || normalized === 'CANCELLED') {
		return 'failed';
	}
	if (normalized === 'INITIATED' || normalized === 'CREATED') return 'initiated';
	return 'processing';
}

function formatAmount(value: string | null | undefined): string {
	const normalized = value?.replace(/,/g, '').trim() ?? '';
	if (!normalized) return '—';
	const amount = Number(normalized);
	return Number.isFinite(amount) ? amountFormatter.format(amount) : value || '—';
}

function formatApiAmount(value: string | null | undefined): string {
	const normalized = value?.replace(/,/g, '').trim() ?? '';
	const amount = Number(normalized);
	return Number.isFinite(amount) ? amount.toFixed(2) : '';
}

function formatDate(value: string): string {
	if (!value) return '—';
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}
