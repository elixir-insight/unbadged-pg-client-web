import type { SettlementOverviewData } from '../../schema';

const currency = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 0
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
	day: '2-digit',
	month: 'short',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit'
});

export function formatSettlementAmount(value: string): string {
	const normalized = value.replace(/,/g, '').trim();
	if (!normalized) return '—';
	const amount = Number(normalized);
	if (!Number.isFinite(amount)) return value;
	return currency.format(amount);
}

function formatSettlementDatetime(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const date = new Date(trimmed);
	if (Number.isNaN(date.getTime())) return trimmed;
	return dateTimeFormatter.format(date);
}

export interface SettlementOverviewView {
	totalSettledAmount: string;
	awaitingSettlementAmount: string;
	lastSettlement: {
		amount: string;
		settlementId: string;
		settlementDatetime: string | null;
	} | null;
}

export function mapSettlementOverview(data: SettlementOverviewData): SettlementOverviewView {
	const last = data.lastSettlement;
	const hasLastSettlement = Boolean(last?.settlementId?.trim());

	return {
		totalSettledAmount: formatSettlementAmount(data.totalSettledAmount),
		awaitingSettlementAmount: formatSettlementAmount(data.awaitingSettlementAmount),
		lastSettlement:
			hasLastSettlement && last
				? {
						amount: formatSettlementAmount(last.amount),
						settlementId: last.settlementId,
						settlementDatetime: formatSettlementDatetime(last.settlementDatetime)
					}
				: null
	};
}
