import type {
	OrderStats,
	SettlementDetail,
	SettlementListItem,
	SettlementMoneySummary,
	SettlementTransaction,
	SettlementStatus,
	TransactionType
} from './types';

// ── Deterministic mock data generator ───────────────────────────────────────
// Every settlement is derived from a seed built out of (merchantId, date), so
// the same settlementId always regenerates the same detail — no shared store
// needed to keep the list page and the detail page in sync for a mock backend.
//
// TODO: replace this whole module with real API calls:
//   - list/summary: Omniware `getsettlements` (settlement_id, bank_reference,
//     payout_amount, sale_amount, chargeback_amount, refund_amount, completed)
//   - detail transactions: Omniware `getsettlementdetails` (transaction_id,
//     order_id, gross_transaction_amount, tdr_amount, amount_reimbursed)

const MERCHANTS: { id: string; code: string; name: string }[] = [
	{ id: 'MER01', code: 'MER01', name: 'Meridian Retail Pvt Ltd' },
	{ id: 'MER02', code: 'MER02', name: 'Solaris Home & Living' },
	{ id: 'MER03', code: 'MER03', name: 'Vantage Electronics' },
	{ id: 'MER04', code: 'MER04', name: 'Northgate Apparel Co.' },
	{ id: 'MER05', code: 'MER05', name: 'Bluepeak Foods' },
	{ id: 'MER06', code: 'MER06', name: 'Everline Pharmacy' },
	{ id: 'MER07', code: 'MER07', name: 'Crestwood Furnishings' },
	{ id: 'MER08', code: 'MER08', name: 'Orbit Mobility Services' },
	{ id: 'MER09', code: 'MER09', name: 'Harborlight Books & Stationery' }
];

const PAYMENT_MODES = ['UPI', 'Net Banking', 'Credit Card', 'Debit Card', 'Wallet'];

function hashString(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash << 5) - hash + value.charCodeAt(i);
		hash |= 0;
	}
	return hash >>> 0;
}

/** mulberry32 — small deterministic PRNG seeded from a string hash. */
function rngFromSeed(seed: string): () => number {
	let state = hashString(seed);
	return () => {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function statusForSeed(rng: () => number): SettlementStatus {
	// ~85% of daily settlements complete same-day, rest stay pending.
	return rng() < 0.85 ? 'completed' : 'pending';
}

export function buildSettlementId(merchantCode: string, date: string): string {
	return `STL-${merchantCode}-${date.replace(/-/g, '')}`;
}

export function parseSettlementId(
	settlementId: string
): { merchantCode: string; date: string } | null {
	const match = settlementId.match(/^STL-([A-Z0-9]+)-(\d{4})(\d{2})(\d{2})$/);
	if (!match) return null;
	const [, merchantCode, year, month, day] = match;
	return { merchantCode, date: `${year}-${month}-${day}` };
}

function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

function buildTransactions(
	merchantId: string,
	date: string,
	orderCount: number
): SettlementTransaction[] {
	const rng = rngFromSeed(`txns:${merchantId}:${date}`);
	const transactions: SettlementTransaction[] = [];

	for (let i = 0; i < orderCount; i++) {
		const roll = rng();
		const type: TransactionType = roll < 0.88 ? 'sale' : roll < 0.96 ? 'refund' : 'chargeback';
		const gross = round2(300 + rng() * 15000);
		const tdr = round2(gross * (0.015 + rng() * 0.01));
		const net = type === 'sale' ? round2(gross - tdr) : round2(-(gross - tdr));
		const paymentMode = PAYMENT_MODES[Math.floor(rng() * PAYMENT_MODES.length)];

		transactions.push({
			transactionId: `TXN-${merchantId}-${date.replace(/-/g, '')}-${String(i + 1).padStart(4, '0')}`,
			orderId: `ORD-${merchantId}-${date.replace(/-/g, '')}-${String(i + 1).padStart(4, '0')}`,
			type,
			grossAmount: gross,
			tdrAmount: tdr,
			netAmount: net,
			paymentMode
		});
	}

	return transactions;
}

function summarizeTransactions(transactions: SettlementTransaction[]) {
	const saleAmount = round2(
		transactions.filter((t) => t.type === 'sale').reduce((sum, t) => sum + t.grossAmount, 0)
	);
	const deductions = round2(transactions.reduce((sum, t) => sum + t.tdrAmount, 0));
	const netPayout = round2(transactions.reduce((sum, t) => sum + t.netAmount, 0));
	return { saleAmount, deductions, netPayout };
}

function orderCountForMerchant(merchantId: string, date: string): number {
	const rng = rngFromSeed(`count:${merchantId}:${date}`);
	return 5 + Math.floor(rng() * 55);
}

/** TODO: replace with real API — Omniware `getsettlements` for the given date. */
export function getSettlementsForDate(date: string): SettlementListItem[] {
	return MERCHANTS.map((merchant) => {
		const rng = rngFromSeed(`status:${merchant.id}:${date}`);
		const status = statusForSeed(rng);
		const orderCount = orderCountForMerchant(merchant.id, date);
		const transactions = buildTransactions(merchant.id, date, orderCount);
		const { saleAmount, deductions, netPayout } = summarizeTransactions(transactions);

		return {
			merchantId: merchant.id,
			merchantName: merchant.name,
			settlementId: buildSettlementId(merchant.code, date),
			settlementDate: date,
			saleAmount,
			deductions,
			netPayout,
			status,
			bankReference: status === 'completed' ? `UTR${merchant.code}${date.replace(/-/g, '')}` : null
		} satisfies SettlementListItem;
	});
}

/**
 * Order-status counts for the day, aggregated across all merchants.
 * Sourced from the internal orders/transactions service — kept as a
 * separate fetch from the money totals below so each can be swapped for a
 * real API independently.
 * TODO: replace with real API — internal orders/transactions service.
 */
export function getOrderStatsForDate(date: string): OrderStats {
	return MERCHANTS.reduce<OrderStats>(
		(acc, merchant) => {
			const orderCount = orderCountForMerchant(merchant.id, date);
			const rng = rngFromSeed(`orderstats:${merchant.id}:${date}`);
			const failed = Math.round(orderCount * (0.01 + rng() * 0.02));
			const pending = Math.round(orderCount * (0.02 + rng() * 0.03));
			const created = Math.round(orderCount * (0.01 + rng() * 0.02));
			const successful = orderCount - failed - pending - created;

			return {
				orders: acc.orders + orderCount,
				successful: acc.successful + Math.max(0, successful),
				pending: acc.pending + pending,
				created: acc.created + created,
				failed: acc.failed + failed
			};
		},
		{ orders: 0, successful: 0, pending: 0, created: 0, failed: 0 }
	);
}

/**
 * Money-level aggregates for the day, from the settlement service.
 * TODO: replace with real API — Omniware `getsettlements` aggregate/summary.
 */
export function getMoneySummaryForDate(date: string): SettlementMoneySummary {
	const settlements = getSettlementsForDate(date);
	return settlements.reduce<SettlementMoneySummary>(
		(acc, s) => ({
			totalSaleAmount: round2(acc.totalSaleAmount + s.saleAmount),
			totalDeductions: round2(acc.totalDeductions + s.deductions),
			netSettled: round2(acc.netSettled + (s.status === 'completed' ? s.netPayout : 0)),
			merchantsPending: acc.merchantsPending + (s.status === 'pending' ? 1 : 0)
		}),
		{ totalSaleAmount: 0, totalDeductions: 0, netSettled: 0, merchantsPending: 0 }
	);
}

/** TODO: replace with real API — Omniware `getsettlementdetails` for this settlement. */
export function getSettlementDetail(settlementId: string): SettlementDetail | null {
	const parsed = parseSettlementId(settlementId);
	if (!parsed) return null;

	const merchant = MERCHANTS.find((m) => m.code === parsed.merchantCode);
	if (!merchant) return null;

	const { date } = parsed;
	const rng = rngFromSeed(`status:${merchant.id}:${date}`);
	const status = statusForSeed(rng);
	const orderCount = orderCountForMerchant(merchant.id, date);
	const transactions = buildTransactions(merchant.id, date, orderCount);
	const { saleAmount, deductions, netPayout } = summarizeTransactions(transactions);

	const failed = Math.round(orderCount * 0.02);
	const pending = Math.round(orderCount * 0.03);
	const created = Math.round(orderCount * 0.02);
	const successful = Math.max(0, orderCount - failed - pending - created);

	return {
		settlementId,
		merchantId: merchant.id,
		merchantName: merchant.name,
		settlementDatetime: `${date}T18:30:00+05:30`,
		bankReference: status === 'completed' ? `UTR${merchant.code}${date.replace(/-/g, '')}` : '—',
		saleAmount,
		deductions,
		netPayout,
		status,
		orderStats: { orders: orderCount, successful, pending, created, failed },
		transactions
	};
}
