import type { PaymentMixItem } from '$lib/components/merchant-dashboard';
import type { CommissionChartData } from '../../schema';

const CHART_COLORS = [
	'var(--chart-1)',
	'var(--chart-2)',
	'var(--chart-3)',
	'var(--chart-4)',
	'var(--chart-5)'
] as const;

const TYPE_LABELS: Record<string, string> = {
	payin: 'Pay-In',
	payout: 'Payout',
	refund: 'Refund'
};

function formatTypeLabel(label: string): string {
	const trimmed = label.trim();
	if (!trimmed) return 'Other';

	const normalized = trimmed.toLowerCase().replace(/[\s-]+/g, '_');
	const known = TYPE_LABELS[normalized];
	if (known) return known;

	return trimmed.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function mapCommissionChart(data: CommissionChartData): PaymentMixItem[] {
	const types = data.transactionTypes.filter((item) => item.value > 0);
	const total =
		data.totalCommission > 0
			? data.totalCommission
			: types.reduce((sum, item) => sum + item.value, 0);

	if (total <= 0 || types.length === 0) {
		return [];
	}

	return types.map((item, index) => ({
		label: formatTypeLabel(item.label),
		amount: item.value,
		percentage: Math.round((item.value / total) * 100),
		color: CHART_COLORS[index % CHART_COLORS.length]
	}));
}

export function emptyCommissionChart(): PaymentMixItem[] {
	return [];
}
