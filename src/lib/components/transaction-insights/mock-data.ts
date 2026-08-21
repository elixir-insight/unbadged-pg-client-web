import type { InsightsDaySummary, InsightsMerchant } from './types';

/** Seeded merchants used until Transaction Insights APIs are wired. */
export const MOCK_INSIGHTS_MERCHANTS: InsightsMerchant[] = [
	{ id: 'mcht-elitecare', name: 'Elitecare', status: 'active' },
	{ id: 'mcht-jublpay-one', name: 'Jublpay ONE', status: 'active' },
	{ id: 'mcht-suresh', name: 'Suresh', status: 'active' },
	{ id: 'mcht-cloudsphere', name: 'CloudSphere Sytems', status: 'active' },
	{ id: 'mcht-bliss', name: 'Bliss', status: 'active' },
	{ id: 'mcht-john-co', name: 'John & co', status: 'active' },
	{ id: 'mcht-kings', name: 'kings pvt ltd', status: 'active' },
	{ id: 'mcht-triumph', name: 'Triumph', status: 'frozen' },
	{ id: 'mcht-vapt', name: 'vapt demo', status: 'hold' }
];

export function getInsightsMerchantById(merchantId: string): InsightsMerchant | undefined {
	return MOCK_INSIGHTS_MERCHANTS.find((merchant) => merchant.id === merchantId);
}

/** Lightweight per-day placeholders for calendar cells (mock only). */
export function getMockDaySummaries(
	merchantId: string,
	year: number,
	month: number
): InsightsDaySummary[] {
	const daysInMonth = new Date(year, month, 0).getDate();
	const summaries: InsightsDaySummary[] = [];

	for (let day = 1; day <= daysInMonth; day += 1) {
		const seed = hashSeed(`${merchantId}-${year}-${month}-${day}`);
		if (seed % 3 === 0) continue;

		summaries.push({
			date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
			transactionCount: (seed % 12) + 1,
			volume: ((seed % 50) + 1) * 1_000
		});
	}

	return summaries;
}

function hashSeed(value: string): number {
	let hash = 0;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
	}
	return hash;
}
