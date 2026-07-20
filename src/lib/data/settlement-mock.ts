import type {
	AccountSettlementConfig,
	FeeBreakdown,
	Settlement,
	SettlementOrder
} from '$lib/types/settlement';

// ── Account settlement config — schedule text + instant-settlement eligibility
// come from account config, not hardcoded copy in the component. Swap for a
// real API call later, e.g. const config = await api.get<AccountSettlementConfig>('/merchant/account/settlement-config');
export const accountSettlementConfig: AccountSettlementConfig = {
	domesticLeadTimeText: 'Domestic settlements arrive in T+2 working days',
	internationalLeadTimeText: 'International settlements arrive in T+5 working days',
	instantSettlementEligible: true,
	availableBalance: 486230
};

function feeFor(amount: number, ratePercent: number): FeeBreakdown {
	const processingFee = Math.round(amount * (ratePercent / 100) * 100) / 100;
	const gst = Math.round(processingFee * 0.18 * 100) / 100;
	return {
		rate: ratePercent,
		processingFee,
		gst,
		totalFee: Math.round((processingFee + gst) * 100) / 100
	};
}

function makeOrder(
	id: string,
	description: string,
	amount: number,
	ratePercent: number,
	adjusted?: { reason: string }
): SettlementOrder {
	const feeBreakdown = feeFor(amount, ratePercent);
	return {
		id,
		description,
		amount,
		fee: feeBreakdown.totalFee,
		netAmount: Math.round((amount - feeBreakdown.totalFee) * 100) / 100,
		adjusted,
		feeBreakdown
	};
}

function sum(values: number[]): number {
	return Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;
}

const DAY_MS = 86_400_000;

function isoDaysAgo(days: number): string {
	return new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10);
}

function isoHoursFromNow(hours: number): string {
	return new Date(Date.now() + hours * 3600_000).toISOString();
}

// ── Settlements — orders drive gross/fees/net so the amount-breakup ledger and
// the order-row expand always reconcile, except STL-20260628-0040 which
// deliberately models chargebacks on orders outside this page (see
// reconciliationGap) — a realistic case the details screen must render
// honestly rather than fake a match.
const settlementSeeds: {
	id: string;
	daysAgo: number;
	status: Settlement['status'];
	bank: Settlement['settledTo'];
	orders: SettlementOrder[];
	refundsAndChargebacks?: number;
	reconciliationGap?: string;
	utr?: string;
}[] = [
	{
		id: 'STL-20260714-0001',
		daysAgo: 1,
		status: 'settled',
		bank: { bankName: 'HDFC Bank', accountLast4: '4821' },
		orders: [
			makeOrder('ORD-20260714-0091', 'Order payment · INV-3341', 18400, 2),
			makeOrder('ORD-20260714-0092', 'Order payment · INV-3342', 9250, 2),
			makeOrder('ORD-20260714-0093', 'Subscription renewal', 4600, 2)
		]
	},
	{
		id: 'STL-20260713-0014',
		daysAgo: 2,
		status: 'settled',
		bank: { bankName: 'HDFC Bank', accountLast4: '4821' },
		orders: [
			makeOrder('ORD-20260713-0071', 'Order payment · INV-3312', 25600, 2),
			makeOrder('ORD-20260713-0072', 'Order payment · INV-3313', 12400, 2)
		]
	},
	{
		id: 'STL-20260712-0009',
		daysAgo: 3,
		status: 'processing',
		bank: { bankName: 'HDFC Bank', accountLast4: '4821' },
		orders: [
			makeOrder('ORD-20260712-0051', 'Order payment · INV-3298', 47500, 2),
			makeOrder('ORD-20260712-0052', 'Order payment · INV-3299', 15200, 2)
		]
	},
	{
		id: 'STL-20260712-0008',
		daysAgo: 3,
		status: 'settled',
		bank: { bankName: 'HDFC Bank', accountLast4: '4821' },
		orders: [makeOrder('ORD-20260712-0041', 'Order payment · INV-3287', 13320, 2)]
	},
	{
		id: 'STL-20260711-0027',
		daysAgo: 4,
		status: 'failed',
		bank: { bankName: 'HDFC Bank', accountLast4: '4821' },
		orders: [makeOrder('ORD-20260711-0033', 'Order payment · INV-3271', 6890, 2)]
	},
	{
		id: 'STL-20260710-0026',
		daysAgo: 5,
		status: 'settled',
		bank: { bankName: 'HDFC Bank', accountLast4: '4821' },
		orders: [
			makeOrder('ORD-20260710-0021', 'Order payment · INV-3255', 31240, 2),
			makeOrder('ORD-20260710-0022', 'Order payment · INV-3256', 9800, 2, {
				reason: 'Partial refund applied'
			})
		]
	},
	{
		id: 'STL-20260709-0025',
		daysAgo: 6,
		status: 'processing',
		bank: { bankName: 'HDFC Bank', accountLast4: '4821' },
		orders: [makeOrder('ORD-20260709-0011', 'Order payment · INV-3240', 15600, 2)]
	},
	{
		id: 'STL-20260708-0041',
		daysAgo: 7,
		status: 'settled',
		bank: { bankName: 'HDFC Bank', accountLast4: '4821' },
		orders: [
			makeOrder('ORD-20260708-0001', 'Order payment · INV-3221', 8900, 2),
			makeOrder('ORD-20260708-0002', 'Order payment · INV-3222', 21100, 2),
			makeOrder('ORD-20260708-0003', 'Order payment · INV-3223', 6700, 2)
		]
	},
	{
		id: 'STL-20260628-0040',
		daysAgo: 17,
		status: 'settled',
		bank: { bankName: 'HDFC Bank', accountLast4: '4821' },
		orders: [
			makeOrder('ORD-20260628-9001', 'Order payment · INV-3050', 24000, 2),
			makeOrder('ORD-20260628-9002', 'Order payment · INV-3051', 17200, 2)
		],
		refundsAndChargebacks: 3200,
		reconciliationGap:
			'A chargeback of ₹3,200 from an earlier settlement cycle was deducted here — it is not tied to any order shown on this page.'
	},
	{
		id: 'STL-20260627-0009',
		daysAgo: 18,
		status: 'settled',
		bank: { bankName: 'HDFC Bank', accountLast4: '4821' },
		orders: [makeOrder('ORD-20260627-8001', 'Order payment · INV-3012', 17680, 2)]
	}
];

function buildSettlement(seed: (typeof settlementSeeds)[number]): Settlement {
	const grossAmount = sum(seed.orders.map((o) => o.amount));
	const orderFees = sum(seed.orders.map((o) => o.fee));
	const refundsAndChargebacks = seed.refundsAndChargebacks ?? 0;
	const netAmount = sum([grossAmount, -orderFees, -refundsAndChargebacks]);
	const isSettled = seed.status === 'settled';
	const isProcessing = seed.status === 'processing';

	return {
		id: seed.id,
		utr: isSettled ? (seed.utr ?? `UTR${seed.id.replace(/\D/g, '').slice(0, 12)}`) : null,
		status: seed.status,
		settledOn: isSettled ? isoDaysAgo(seed.daysAgo) : null,
		expectedOn: isProcessing ? isoHoursFromNow(6) : null,
		settledTo: seed.bank,
		grossAmount,
		refundsAndChargebacks,
		fees: orderFees,
		netAmount,
		transactionCount: seed.orders.length,
		orders: seed.orders,
		reconciliationGap: seed.reconciliationGap ? { note: seed.reconciliationGap } : undefined
	};
}

export const settlements: Settlement[] = settlementSeeds.map(buildSettlement);

export function getSettlement(id: string): Settlement | undefined {
	return settlements.find((s) => s.id === id);
}
