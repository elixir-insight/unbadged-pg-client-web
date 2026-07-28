import type { PayinPaymentStatus } from '$lib/types/payin';

export type DashboardRange = 'today' | '7d' | '30d' | 'custom';

export interface CollectionTrendPoint {
	label: string;
	value: number;
}

export interface PaymentMixItem {
	label: string;
	amount: number;
	percentage: number;
	color: string;
}

export interface FunnelStage {
	label: string;
	count: number;
	percentage: number;
	change: number | null;
}

export interface FunnelOutcome {
	label: string;
	count: number;
}

export interface DashboardTransaction {
	txnId: string;
	orderId: string;
	customer: string;
	amount: number;
	method: string;
	status: PayinPaymentStatus;
	settlement: string;
	date: string;
}

export interface DashboardSettlement {
	id: string;
	date: string;
	grossAmount: number;
	netAmount: number;
	refunds: number;
	status: 'settled' | 'pending' | 'failed';
	utr: string | null;
}

export interface DashboardSnapshot {
	totalCollections: number;
	collectionChange: number;
	transactionCount: number;
	successRate: number;
	successRateChange: number;
	averageTransactionValue: number;
	averageTransactionChange: number;
	awaitingSettlement: number;
	totalSettled: number;
	trend: CollectionTrendPoint[];
	paymentMix: PaymentMixItem[];
	funnel: FunnelStage[];
	funnelOutcomes: FunnelOutcome[];
	transactions: DashboardTransaction[];
	settlements: DashboardSettlement[];
}

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

export function formatDashboardCurrency(value: number, compact = false): string {
	return (compact ? compactCurrency : currency).format(value);
}

const transactions: DashboardTransaction[] = [
	{
		txnId: 'PAT_28910',
		orderId: 'ORD_28910',
		customer: 'Aarav Mehta',
		amount: 24384,
		method: 'UPI',
		status: 'success',
		settlement: 'Awaiting',
		date: 'Today, 10:32 AM'
	},
	{
		txnId: 'PAT_28901',
		orderId: 'ORD_28901',
		customer: 'Priya Sharma',
		amount: 21423,
		method: 'Card',
		status: 'success',
		settlement: 'Settled',
		date: 'Today, 9:55 AM'
	},
	{
		txnId: 'PAT_28876',
		orderId: 'ORD_28876',
		customer: 'Rohit Iyer',
		amount: 19287,
		method: 'Netbanking',
		status: 'success',
		settlement: 'Settled',
		date: 'Today, 9:18 AM'
	},
	{
		txnId: 'PAT_28853',
		orderId: 'ORD_28853',
		customer: 'Sneha Kapoor',
		amount: 15094,
		method: 'Wallet',
		status: 'success',
		settlement: 'Settled',
		date: 'Today, 8:41 AM'
	},
	{
		txnId: 'PAT_28840',
		orderId: 'ORD_28840',
		customer: 'Vikram Singh',
		amount: 9928,
		method: 'UPI',
		status: 'pending',
		settlement: 'Awaiting',
		date: 'Today, 8:04 AM'
	},
	{
		txnId: 'PAT_28817',
		orderId: 'ORD_28817',
		customer: 'Ananya Nair',
		amount: 15804,
		method: 'Card',
		status: 'failed',
		settlement: '—',
		date: 'Today, 7:27 AM'
	}
];

const settlements: DashboardSettlement[] = [
	{
		id: 'STL_9F3K21A',
		date: '19 Jul 2026',
		grossAmount: 486120,
		netAmount: 476210,
		refunds: 7510,
		status: 'settled',
		utr: 'HDFC0007281193'
	},
	{
		id: 'STL_9F3K28Z',
		date: '18 Jul 2026',
		grossAmount: 512480,
		netAmount: 502190,
		refunds: 10290,
		status: 'settled',
		utr: 'HDFC0007281102'
	},
	{
		id: 'STL_9F3K19Y',
		date: '17 Jul 2026',
		grossAmount: 342180,
		netAmount: 336240,
		refunds: 4740,
		status: 'pending',
		utr: null
	},
	{
		id: 'STL_9F3K11J',
		date: '16 Jul 2026',
		grossAmount: 448920,
		netAmount: 439870,
		refunds: 8250,
		status: 'settled',
		utr: 'HDFC0007289015'
	},
	{
		id: 'STL_9F3K8W',
		date: '15 Jul 2026',
		grossAmount: 219410,
		netAmount: 214760,
		refunds: 4650,
		status: 'failed',
		utr: null
	}
];

function paymentMix(total: number, shares: number[]): PaymentMixItem[] {
	const labels = ['UPI', 'Cards', 'Netbanking', 'Wallet'];
	const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

	return labels.map((label, index) => ({
		label,
		percentage: shares[index],
		amount: Math.round((total * shares[index]) / 100),
		color: colors[index]
	}));
}

const snapshots: Record<Exclude<DashboardRange, 'custom'>, DashboardSnapshot> = {
	today: {
		totalCollections: 4830000,
		collectionChange: 12.4,
		transactionCount: 2218,
		successRate: 96.4,
		successRateChange: 0.6,
		averageTransactionValue: 2178,
		averageTransactionChange: -3.1,
		awaitingSettlement: 342180,
		totalSettled: 44800000,
		trend: [
			{ label: '6 AM', value: 280000 },
			{ label: '8 AM', value: 640000 },
			{ label: '10 AM', value: 910000 },
			{ label: '12 PM', value: 1180000 },
			{ label: '2 PM', value: 1030000 },
			{ label: '4 PM', value: 790000 }
		],
		paymentMix: paymentMix(4830000, [58, 24, 12, 6]),
		funnel: [
			{ label: 'Created', count: 2580, percentage: 100, change: null },
			{ label: 'Initiated', count: 2478, percentage: 96, change: -4 },
			{ label: 'Authorized', count: 2355, percentage: 91, change: -5 },
			{ label: 'Captured', count: 2218, percentage: 86, change: -6 }
		],
		funnelOutcomes: [
			{ label: 'Failed', count: 189 },
			{ label: 'Expired', count: 81 },
			{ label: 'Cancelled', count: 78 }
		],
		transactions,
		settlements
	},
	'7d': {
		totalCollections: 28740000,
		collectionChange: 8.7,
		transactionCount: 13260,
		successRate: 95.8,
		successRateChange: 0.4,
		averageTransactionValue: 2167,
		averageTransactionChange: -1.8,
		awaitingSettlement: 892410,
		totalSettled: 44800000,
		trend: [
			{ label: 'Mon', value: 3520000 },
			{ label: 'Tue', value: 4080000 },
			{ label: 'Wed', value: 3860000 },
			{ label: 'Thu', value: 4320000 },
			{ label: 'Fri', value: 4710000 },
			{ label: 'Sat', value: 3980000 },
			{ label: 'Sun', value: 4270000 }
		],
		paymentMix: paymentMix(28740000, [56, 25, 13, 6]),
		funnel: [
			{ label: 'Created', count: 15420, percentage: 100, change: null },
			{ label: 'Initiated', count: 14768, percentage: 96, change: -4 },
			{ label: 'Authorized', count: 14031, percentage: 91, change: -5 },
			{ label: 'Captured', count: 13260, percentage: 86, change: -5 }
		],
		funnelOutcomes: [
			{ label: 'Failed', count: 1892 },
			{ label: 'Expired', count: 812 },
			{ label: 'Cancelled', count: 782 }
		],
		transactions,
		settlements
	},
	'30d': {
		totalCollections: 183000000,
		collectionChange: 12.4,
		transactionCount: 82410,
		successRate: 96.4,
		successRateChange: 0.6,
		averageTransactionValue: 2184,
		averageTransactionChange: -3.1,
		awaitingSettlement: 342180,
		totalSettled: 44800000,
		trend: [
			{ label: '22-06', value: 122000 },
			{ label: '24-06', value: 154000 },
			{ label: '26-06', value: 181000 },
			{ label: '28-06', value: 176000 },
			{ label: '30-06', value: 168000 },
			{ label: '02-07', value: 153000 },
			{ label: '04-07', value: 150000 },
			{ label: '06-07', value: 146000 },
			{ label: '08-07', value: 174000 },
			{ label: '10-07', value: 181000 },
			{ label: '12-07', value: 213000 },
			{ label: '14-07', value: 229000 },
			{ label: '16-07', value: 226000 },
			{ label: '18-07', value: 244000 },
			{ label: '20-07', value: 218000 }
		],
		paymentMix: paymentMix(183000000, [58, 24, 12, 6]),
		funnel: [
			{ label: 'Created', count: 94810, percentage: 100, change: null },
			{ label: 'Initiated', count: 91240, percentage: 96, change: -4 },
			{ label: 'Authorized', count: 86510, percentage: 91, change: -5 },
			{ label: 'Captured', count: 82410, percentage: 87, change: -4 }
		],
		funnelOutcomes: [
			{ label: 'Failed', count: 11248 },
			{ label: 'Expired', count: 3940 },
			{ label: 'Cancelled', count: 3212 }
		],
		transactions,
		settlements
	}
};

export function getDashboardSnapshot(
	range: DashboardRange,
	customRangeDays = 30
): DashboardSnapshot {
	if (range !== 'custom') return snapshots[range];
	if (customRangeDays <= 1) return snapshots.today;
	if (customRangeDays <= 7) return snapshots['7d'];
	return snapshots['30d'];
}
