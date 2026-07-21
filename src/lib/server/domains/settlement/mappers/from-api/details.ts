import type { SettlementDetailItem } from '../../schema';
import { parseSettlementAmount } from './list';

export type MappedSettlementDetailTransaction = {
	transactionId: string;
	orderId: string;
	type: 'sale' | 'refund' | 'chargeback';
	grossAmount: number;
	tdrAmount: number;
	netAmount: number;
	paymentMode: string;
};

function inferTransactionType(
	netAmount: number,
	description: string | null | undefined
): MappedSettlementDetailTransaction['type'] {
	const desc = (description ?? '').toLowerCase();
	if (desc.includes('chargeback')) return 'chargeback';
	if (desc.includes('refund') || netAmount < 0) return 'refund';
	return 'sale';
}

export function mapSettlementDetailItem(
	item: SettlementDetailItem
): MappedSettlementDetailTransaction {
	const gross = parseSettlementAmount(item.grossTransactionAmount) ?? 0;
	const net = parseSettlementAmount(item.netSettlementAmount) ?? 0;
	const tdr = parseSettlementAmount(item.tdrAmount) ?? 0;
	const taxOnTdr = parseSettlementAmount(item.taxOnTdrAmount) ?? 0;
	const transactionId = item.payinAttemptId?.trim() || item.id;

	return {
		transactionId,
		orderId: item.orderId?.trim() || '—',
		type: inferTransactionType(net, item.description),
		grossAmount: gross,
		tdrAmount: Math.round((tdr + taxOnTdr) * 100) / 100,
		netAmount: net,
		paymentMode: item.bankPipelineCode?.trim() || '—'
	};
}

export function mapSettlementDetailsResponse(
	items: SettlementDetailItem[]
): MappedSettlementDetailTransaction[] {
	return items.map(mapSettlementDetailItem);
}
