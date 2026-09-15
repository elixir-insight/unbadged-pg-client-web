import type { CardDataTrend } from '$lib/components/reusable';
import type { PartnerKpisData } from '../../schema';

export interface PartnerKpiView {
	label: string;
	value: string;
	subText?: string;
	trend?: CardDataTrend;
	trendLabel?: string;
}

const compactCurrency = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	notation: 'compact',
	maximumFractionDigits: 1
});

function formatAmount(value: number): string {
	if (!Number.isFinite(value)) return '—';
	return compactCurrency.format(value);
}

function formatChangePercent(value: number): Pick<PartnerKpiView, 'trend' | 'trendLabel'> {
	if (!Number.isFinite(value) || value === 0) return {};
	const trend: CardDataTrend = value > 0 ? 'up' : 'down';
	const trendLabel = `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
	return { trend, trendLabel };
}

export function mapPartnerKpis(data: PartnerKpisData): PartnerKpiView[] {
	return [
		{
			label: 'Total Commission',
			value: formatAmount(data.totalCommission.amount),
			...formatChangePercent(data.totalCommission.changePercent)
		},
		{
			label: 'Total Volume',
			value: formatAmount(data.totalVolume.amount),
			...formatChangePercent(data.totalVolume.changePercent)
		},
		{
			label: 'Success Rate',
			value: `${Number(data.successRate.toFixed(1))}%`,
			subText: 'Captured transactions'
		},
		{
			label: 'Active Merchants',
			value: String(Math.round(data.activeMerchants)),
			subText: 'Current count'
		}
	];
}

export function emptyPartnerKpis(): PartnerKpiView[] {
	return [
		{ label: 'Total Commission', value: '—' },
		{ label: 'Total Volume', value: '—' },
		{ label: 'Success Rate', value: '—', subText: 'Captured transactions' },
		{ label: 'Active Merchants', value: '—', subText: 'Current count' }
	];
}
