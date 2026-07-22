import type { PayinPaymentStatus } from '$lib/types/payin';
import type { DashboardTransaction } from '$lib/components/merchant-dashboard/dashboard-data';
import type { PaymentAttemptItem } from '../../../payment-attempt/schema';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
	day: '2-digit',
	month: 'short',
	hour: '2-digit',
	minute: '2-digit',
	timeZone: 'Asia/Kolkata'
});

export function mapPaymentAttemptApiStatus(status: string): PayinPaymentStatus {
	const normalized = status.trim().toUpperCase();
	if (normalized === 'CAPTURED' || normalized === 'SUCCESS') return 'success';
	if (normalized === 'AUTHORIZED') return 'authorized';
	if (normalized === 'REFUNDED' || normalized === 'REFUND_INITIATED') return 'refunded';
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

function parseAmount(value: string | null | undefined): number {
	const normalized = value?.replace(/,/g, '').trim() ?? '';
	if (!normalized) return 0;
	const amount = Number(normalized);
	return Number.isFinite(amount) ? amount : 0;
}

function formatDate(value: string): string {
	if (!value) return '—';
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function settlementLabel(item: PaymentAttemptItem, status: PayinPaymentStatus): string {
	const settlementId = item.settlementId?.trim();
	if (settlementId) return 'Settled';
	if (status === 'success' || status === 'authorized') return 'Awaiting';
	return '—';
}

export function mapRecentTransaction(item: PaymentAttemptItem): DashboardTransaction {
	const status = mapPaymentAttemptApiStatus(item.transactionStatus);
	const orderId = item.orderId?.trim() || '—';
	const payerVpa = item.payerVpa?.trim() || '';

	return {
		txnId: item.payinAttemptId,
		orderId,
		customer: payerVpa || item.clientOrderId?.trim() || '—',
		amount: parseAmount(item.transactionAmount),
		method: item.paymentMethod?.trim() || '—',
		status,
		settlement: settlementLabel(item, status),
		date: formatDate(item.createdAtIst?.trim() || item.createdAt?.trim() || '')
	};
}

export function mapRecentTransactions(items: PaymentAttemptItem[]): DashboardTransaction[] {
	return items.map(mapRecentTransaction);
}
