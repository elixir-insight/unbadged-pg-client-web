import type { PayinPaymentStatus } from '$lib/types/payin';
import type { PaymentAttemptItem } from '$lib/server/domains/payment-attempt/schema';
import { mapPaymentAttemptListItem } from '$lib/server/domains/payment-attempt/mappers/from-api/list';

export interface SettlementOrderFeeBreakdown {
	processingFee: number;
	gst: number;
	totalFee: number;
}

const amountFormatter = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 2
});

function parseAmount(value: string | null | undefined): number {
	if (!value) return 0;
	const normalized = value.replace(/,/g, '').trim();
	if (!normalized) return 0;
	const amount = Number(normalized);
	return Number.isFinite(amount) ? amount : 0;
}

function formatAmount(value: number): string {
	return amountFormatter.format(value);
}

export function mapPaymentAttemptFeeBreakdown(
	item: PaymentAttemptItem
): SettlementOrderFeeBreakdown {
	const processingFee =
		parseAmount(item.processingFee) + parseAmount(item.gatewayFee) + parseAmount(item.partnerFee);
	const gst = parseAmount(item.gatewayGst) + parseAmount(item.partnerGst);

	return {
		processingFee,
		gst,
		totalFee: processingFee + gst
	};
}

export interface SettlementOrderRow extends Record<string, unknown> {
	txnId: string;
	orderId: string;
	description: string;
	customer: string;
	paymentMethod: string;
	status: PayinPaymentStatus;
	amount: string;
	fee: string;
	netAmount: string;
	feeBreakdown: SettlementOrderFeeBreakdown;
}

export function mapSettlementOrderRow(item: PaymentAttemptItem): SettlementOrderRow {
	const listRow = mapPaymentAttemptListItem(item);
	const gross = parseAmount(item.transactionAmount);
	const feeBreakdown = mapPaymentAttemptFeeBreakdown(item);
	const net = gross - feeBreakdown.totalFee;

	return {
		txnId: item.payinAttemptId,
		orderId: listRow.orderId,
		description:
			item.clientDescription?.trim() ||
			item.clientOrderId?.trim() ||
			item.gatewayDescription?.trim() ||
			'—',
		customer: listRow.customer,
		paymentMethod: listRow.paymentMethod,
		status: listRow.status,
		amount: listRow.amount,
		fee: `−${formatAmount(feeBreakdown.totalFee)}`,
		netAmount: formatAmount(net),
		feeBreakdown
	};
}

export function mapSettlementOrderRows(items: PaymentAttemptItem[]): SettlementOrderRow[] {
	return items.map(mapSettlementOrderRow);
}
