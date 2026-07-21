import type { PaymentMixData } from '../../schema';

export interface PaymentMixChartItem {
	label: string;
	amount: number;
	percentage: number;
	color: string;
}

const CHART_COLORS = [
	'var(--chart-1)',
	'var(--chart-2)',
	'var(--chart-3)',
	'var(--chart-4)',
	'var(--chart-5)'
] as const;

const METHOD_LABELS: Record<string, string> = {
	upi: 'UPI',
	card: 'Cards',
	cards: 'Cards',
	credit_card: 'Credit card',
	debit_card: 'Debit card',
	netbanking: 'Netbanking',
	net_banking: 'Netbanking',
	wallet: 'Wallet',
	emi: 'EMI',
	bnpl: 'BNPL'
};

function formatMethodLabel(method: string): string {
	const trimmed = method.trim();
	if (!trimmed) return 'Other';

	const normalized = trimmed.toLowerCase().replace(/[\s-]+/g, '_');
	const known = METHOD_LABELS[normalized];
	if (known) return known;

	return trimmed.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function mapPaymentMix(data: PaymentMixData): PaymentMixChartItem[] {
	const methods = data.paymentMethods.filter((item) => item.volume > 0);
	const total =
		data.totalVolume > 0 ? data.totalVolume : methods.reduce((sum, item) => sum + item.volume, 0);

	if (total <= 0 || methods.length === 0) {
		return [];
	}

	return methods.map((item, index) => ({
		label: formatMethodLabel(item.method),
		amount: item.volume,
		percentage: Math.round((item.volume / total) * 100),
		color: CHART_COLORS[index % CHART_COLORS.length]
	}));
}
