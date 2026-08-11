// TEMP: dummy data until /partner/settlements/[merchantId] API. Replace function bodies only —
// keep exported names and return types identical.

import type { PartnerMerchant, PartnerSettlementEntry } from './types';
import { calculateSettlementStatus } from './shared';

const PARTNER_MERCHANTS: PartnerMerchant[] = [
	{ id: 'MRC-10021', name: 'BlueCart Retail', city: 'Mumbai', commissionEarned: 36_900 },
	{ id: 'MRC-10034', name: 'Nova Health Labs', city: 'Bengaluru', commissionEarned: 18_460 },
	{ id: 'MRC-10052', name: 'GreenLeaf Organics', city: 'Pune', commissionEarned: 51_200 },
	{ id: 'MRC-10089', name: 'Cafe Mornings', city: 'Chennai', commissionEarned: 13_780 },
	{ id: 'MRC-10139', name: 'AutoCare Pro', city: 'Hyderabad', commissionEarned: 62_480 },
	{ id: 'MRC-10235', name: 'QuickMed Pharmacy', city: 'Delhi', commissionEarned: 28_740 }
];

let entries: PartnerSettlementEntry[] = [
	{
		id: 'pse-001',
		merchantId: 'MRC-10021',
		date: '2026-06-28',
		amount: 12_400,
		tds: 620,
		gst: 2_232,
		accountNumber: '9988776655',
		ifsc: 'HDFC0001234',
		utr: 'UTR202606281001'
	},
	{
		id: 'pse-002',
		merchantId: 'MRC-10021',
		date: '2026-06-27',
		amount: 18_600,
		tds: 930,
		gst: 3_348,
		accountNumber: '9988776655',
		ifsc: 'HDFC0001234',
		utr: 'UTR202606271002'
	},
	{
		id: 'pse-003',
		merchantId: 'MRC-10034',
		date: '2026-06-29',
		amount: 9_200,
		tds: 460,
		gst: 1_656,
		accountNumber: '1122334455',
		ifsc: 'ICIC0000456',
		utr: 'UTR202606291003'
	},
	{
		id: 'pse-004',
		merchantId: 'MRC-10052',
		date: '2026-06-30',
		amount: 25_600,
		tds: 1_280,
		gst: 4_608,
		accountNumber: '5566778899',
		ifsc: 'SBIN0000789',
		utr: 'UTR202606301004'
	},
	{
		id: 'pse-005',
		merchantId: 'MRC-10052',
		date: '2026-06-28',
		amount: 15_400,
		tds: 770,
		gst: 2_772,
		accountNumber: '5566778899',
		ifsc: 'SBIN0000789',
		utr: 'UTR202606281005'
	},
	{
		id: 'pse-006',
		merchantId: 'MRC-10139',
		date: '2026-07-01',
		amount: 31_000,
		tds: 1_550,
		gst: 5_580,
		accountNumber: '6677889900',
		ifsc: 'KKBK0000123',
		utr: 'UTR202607011006'
	},
	{
		id: 'pse-007',
		merchantId: 'MRC-10089',
		date: '2026-06-25',
		amount: 6_800,
		tds: 340,
		gst: 1_224,
		accountNumber: '3344556677',
		ifsc: 'AXIS0000456',
		utr: 'UTR202606251007'
	}
];

function sortEntries(list: PartnerSettlementEntry[]) {
	return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function listPartnerMerchants(): Promise<PartnerMerchant[]> {
	return Promise.resolve([...PARTNER_MERCHANTS]);
}

export function getPartnerMerchantById(merchantId: string): Promise<PartnerMerchant | undefined> {
	return Promise.resolve(PARTNER_MERCHANTS.find((merchant) => merchant.id === merchantId));
}

export function getPartnerSettlementEntries(merchantId: string): Promise<PartnerSettlementEntry[]> {
	return Promise.resolve(sortEntries(entries.filter((entry) => entry.merchantId === merchantId)));
}

export function addPartnerSettlementEntry(
	merchantId: string,
	entry: Omit<PartnerSettlementEntry, 'id' | 'merchantId'>
): Promise<PartnerSettlementEntry> {
	const created: PartnerSettlementEntry = {
		...entry,
		id: `pse-${Date.now()}`,
		merchantId
	};
	entries = [...entries, created];
	return Promise.resolve(created);
}

export function updatePartnerSettlementEntry(
	merchantId: string,
	entryId: string,
	updates: Partial<Omit<PartnerSettlementEntry, 'id' | 'merchantId'>>
): Promise<PartnerSettlementEntry> {
	const index = entries.findIndex(
		(entry) => entry.id === entryId && entry.merchantId === merchantId
	);
	if (index === -1) {
		return Promise.reject(new Error('Settlement entry not found'));
	}

	const updated = { ...entries[index], ...updates };
	entries = entries.map((entry) => (entry.id === entryId ? updated : entry));
	return Promise.resolve(updated);
}

export function deletePartnerSettlementEntry(merchantId: string, entryId: string): Promise<void> {
	const next = entries.filter(
		(entry) => !(entry.id === entryId && entry.merchantId === merchantId)
	);
	if (next.length === entries.length) {
		return Promise.reject(new Error('Settlement entry not found'));
	}
	entries = next;
	return Promise.resolve();
}

export async function buildPartnerMerchantSummary(
	merchant: PartnerMerchant
): Promise<import('./types').PartnerMerchantSummary> {
	const merchantEntries = await getPartnerSettlementEntries(merchant.id);
	const totalSettled = merchantEntries.reduce((sum, entry) => sum + entry.amount, 0);
	const lastSettlementDate = merchantEntries[0]?.date ?? null;

	return {
		...merchant,
		totalSettled,
		pendingAmount: Math.max(merchant.commissionEarned - totalSettled, 0),
		status: calculateSettlementStatus(merchant.commissionEarned, merchantEntries),
		lastSettlementDate,
		entriesCount: merchantEntries.length
	};
}

/** Used by the list route to simulate a fetch failure during development. */
export function shouldSimulatePartnerSettlementsError(search: string) {
	return search === '__error__';
}
