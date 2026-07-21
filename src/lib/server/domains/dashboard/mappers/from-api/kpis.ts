import type { DashboardKpisData } from '../../schema';

const compactCurrency = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	notation: 'compact',
	maximumFractionDigits: 1
});

const currency = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 0
});

function formatAmount(value: number, compact = false): string {
	if (!Number.isFinite(value)) return '—';
	return (compact ? compactCurrency : currency).format(value);
}

function formatChangePercent(value: number): number {
	return Number(value.toFixed(1));
}

export interface DashboardKpisView {
	totalCollections: {
		amount: string;
		changePercent: number;
	};
	avgTransactionValue: {
		amount: string;
		changePercent: number;
	};
	successRate: string;
	totalSettled: string;
	awaitingSettlement: string;
}

export function mapDashboardKpis(data: DashboardKpisData): DashboardKpisView {
	return {
		totalCollections: {
			amount: formatAmount(data.totalCollections.amount, true),
			changePercent: formatChangePercent(data.totalCollections.changePercent)
		},
		avgTransactionValue: {
			amount: formatAmount(data.avgTransactionValue.amount),
			changePercent: formatChangePercent(data.avgTransactionValue.changePercent)
		},
		successRate: `${Number(data.successRate.toFixed(1))}%`,
		totalSettled: formatAmount(data.totalSettled, true),
		awaitingSettlement: formatAmount(data.awaitingSettlement)
	};
}

export function emptyDashboardKpis(): DashboardKpisView {
	return {
		totalCollections: { amount: '—', changePercent: 0 },
		avgTransactionValue: { amount: '—', changePercent: 0 },
		successRate: '—',
		totalSettled: '—',
		awaitingSettlement: '—'
	};
}
