import type { BadgeVariant } from '$lib/components/ui/badge';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SettlementStatus = 'unsettled' | 'partial' | 'settled' | 'adjusted';

export function calculateSettlementStatus(
	commissionEarned: number,
	entryList: { amount: number }[]
): SettlementStatus {
	const totalSettled = entryList.reduce((sum, entry) => sum + entry.amount, 0);
	if (totalSettled === 0) return 'unsettled';
	if (totalSettled < commissionEarned) return 'partial';
	if (totalSettled === commissionEarned) return 'settled';
	return 'adjusted';
}

function resolveRecord(record: SettlementRecord): SettlementRecord {
	const recordEntries = entries.filter((entry) => entry.recordId === record.id);
	return {
		...record,
		entriesCount: recordEntries.length,
		status: calculateSettlementStatus(record.commissionEarned, recordEntries)
	};
}

function syncRecordStatus(recordId: string): void {
	const record = records.find((item) => item.id === recordId);
	if (!record) return;
	const recordEntries = entries.filter((entry) => entry.recordId === recordId);
	record.entriesCount = recordEntries.length;
	record.status = calculateSettlementStatus(record.commissionEarned, recordEntries);
}

export interface SettlementEntry {
	id: string;
	recordId: string;
	date: string;
	amount: number;
	tds: number;
	gst: number;
	accountNumber: string;
	ifsc: string;
	utr: string;
}

export interface SettlementRecord {
	id: string;
	merchantId: string;
	date: string;
	commissionEarned: number;
	entriesCount: number;
	status: SettlementStatus;
}

export interface Merchant {
	id: string;
	partnerId: string;
	name: string;
	city: string;
}

export interface Partner {
	id: string;
	name: string;
	code: string;
}

// ─── Status config ───────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
	SettlementStatus,
	{ label: string; badgeClass: string; chipVariant: BadgeVariant }
> = {
	unsettled: {
		label: 'Unsettled',
		badgeClass: 'bg-destructive/15 text-destructive border-destructive/30',
		chipVariant: 'error'
	},
	partial: {
		label: 'Partial',
		badgeClass: 'bg-warning/15 text-warning border-warning/30',
		chipVariant: 'warning'
	},
	adjusted: {
		label: 'Adjusted',
		badgeClass: 'bg-primary/15 text-primary border-primary/30',
		chipVariant: 'default'
	},
	settled: {
		label: 'Settled',
		badgeClass: 'bg-success/15 text-success border-success/30',
		chipVariant: 'success'
	}
};

export const STATUS_FILTER_OPTIONS: { value: SettlementStatus | 'all'; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'unsettled', label: 'Unsettled' },
	{ value: 'partial', label: 'Partial' },
	{ value: 'adjusted', label: 'Adjusted' },
	{ value: 'settled', label: 'Settled' }
];

// ─── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
	'bg-primary/15 text-primary',
	'bg-success/15 text-success',
	'bg-warning/15 text-warning',
	'bg-destructive/15 text-destructive'
] as const;

export function avatarClasses(name: string): string {
	const hash = [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0);
	return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

export function merchantInitials(name: string): string {
	return name
		.split(' ')
		.filter(Boolean)
		.map((part) => part[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();
}

// ─── Formatters ────────────────────────────────────────────────────────────────

export function formatInr(amount: number): string {
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 0
	}).format(amount);
}

export function formatInrDetailed(amount: number): string {
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(amount);
}

export function formatEntriesLabel(count: number): string {
	return count === 1 ? '1 entry' : `${count} entries`;
}

export function calcEntryTaxes(amount: number): { tds: number; gst: number } {
	return {
		tds: Math.round(amount * 0.05 * 100) / 100,
		gst: Math.round(amount * 0.18 * 100) / 100
	};
}

function mkEntry(
	id: string,
	recordId: string,
	date: string,
	amount: number,
	overrides: Partial<SettlementEntry> = {}
): SettlementEntry {
	const taxes = calcEntryTaxes(amount);
	return {
		id,
		recordId,
		date,
		amount,
		tds: taxes.tds,
		gst: taxes.gst,
		accountNumber: '1122334455',
		ifsc: 'KOTAK001234',
		utr: `UTR${date.replace(/-/g, '')}${id.replace(/\D/g, '').slice(-5)}`,
		...overrides
	};
}

export function getSettlementTotals(
	record: SettlementRecord,
	recordEntries: SettlementEntry[]
): { commissionEarned: number; totalSettled: number; remaining: number } {
	const totalSettled = recordEntries.reduce((sum, entry) => sum + entry.amount, 0);
	return {
		commissionEarned: record.commissionEarned,
		totalSettled,
		remaining: record.commissionEarned - totalSettled
	};
}

export function formatRecordDate(isoDate: string): string {
	return new Intl.DateTimeFormat('en-IN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	}).format(new Date(isoDate));
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

export const partners: Partner[] = [
	{ id: 'ptr-001', name: 'FinEdge Partners', code: 'FE' },
	{ id: 'ptr-002', name: 'PayRoute Solutions', code: 'PR' },
	{ id: 'ptr-003', name: 'MerchantBridge India', code: 'MB' }
];

export const merchants: Merchant[] = [
	{ id: 'mrc-101', partnerId: 'ptr-001', name: 'Urban Retail Hub', city: 'Mumbai' },
	{ id: 'mrc-102', partnerId: 'ptr-001', name: 'GreenCart Stores', city: 'Pune' },
	{ id: 'mrc-103', partnerId: 'ptr-001', name: 'Swift Logistics', city: 'Nashik' },
	{ id: 'mrc-201', partnerId: 'ptr-002', name: 'Nova Electronics', city: 'Bengaluru' },
	{ id: 'mrc-202', partnerId: 'ptr-002', name: 'CloudKitchen Co', city: 'Hyderabad' },
	{ id: 'mrc-301', partnerId: 'ptr-003', name: 'Heritage Textiles', city: 'Chennai' },
	{ id: 'mrc-302', partnerId: 'ptr-003', name: 'AutoParts Direct', city: 'Coimbatore' }
];

export const records: SettlementRecord[] = [
	{
		id: 'rec-1001',
		merchantId: 'mrc-101',
		date: '2026-06-28',
		commissionEarned: 48_500,
		entriesCount: 12,
		status: 'unsettled'
	},
	{
		id: 'rec-1002',
		merchantId: 'mrc-101',
		date: '2026-06-21',
		commissionEarned: 36_200,
		entriesCount: 9,
		status: 'partial'
	},
	{
		id: 'rec-1003',
		merchantId: 'mrc-101',
		date: '2026-06-14',
		commissionEarned: 52_800,
		entriesCount: 14,
		status: 'settled'
	},
	{
		id: 'rec-1004',
		merchantId: 'mrc-101',
		date: '2026-06-07',
		commissionEarned: 41_000,
		entriesCount: 11,
		status: 'settled'
	},
	{
		id: 'rec-1005',
		merchantId: 'mrc-101',
		date: '2026-05-31',
		commissionEarned: 29_600,
		entriesCount: 8,
		status: 'adjusted'
	},
	{
		id: 'rec-1006',
		merchantId: 'mrc-101',
		date: '2026-05-24',
		commissionEarned: 44_300,
		entriesCount: 10,
		status: 'settled'
	},
	{
		id: 'rec-2001',
		merchantId: 'mrc-102',
		date: '2026-06-27',
		commissionEarned: 22_400,
		entriesCount: 6,
		status: 'partial'
	},
	{
		id: 'rec-2002',
		merchantId: 'mrc-102',
		date: '2026-06-20',
		commissionEarned: 18_900,
		entriesCount: 5,
		status: 'settled'
	},
	{
		id: 'rec-3001',
		merchantId: 'mrc-103',
		date: '2026-06-26',
		commissionEarned: 31_750,
		entriesCount: 7,
		status: 'unsettled'
	},
	{
		id: 'rec-4001',
		merchantId: 'mrc-201',
		date: '2026-06-29',
		commissionEarned: 67_200,
		entriesCount: 16,
		status: 'unsettled'
	},
	{
		id: 'rec-4002',
		merchantId: 'mrc-201',
		date: '2026-06-22',
		commissionEarned: 58_400,
		entriesCount: 13,
		status: 'adjusted'
	},
	{
		id: 'rec-5001',
		merchantId: 'mrc-202',
		date: '2026-06-25',
		commissionEarned: 15_600,
		entriesCount: 4,
		status: 'settled'
	},
	{
		id: 'rec-6001',
		merchantId: 'mrc-301',
		date: '2026-06-24',
		commissionEarned: 39_800,
		entriesCount: 9,
		status: 'partial'
	},
	{
		id: 'rec-7001',
		merchantId: 'mrc-302',
		date: '2026-06-23',
		commissionEarned: 27_500,
		entriesCount: 6,
		status: 'settled'
	}
];

export const entries: SettlementEntry[] = [
	mkEntry('ent-1', 'rec-1001', '2026-06-28', 12_400),
	mkEntry('ent-2', 'rec-1001', '2026-06-28', 18_600),
	mkEntry('ent-3', 'rec-1001', '2026-06-27', 17_500, {
		tds: 875,
		gst: 3_150,
		accountNumber: '9988776655',
		ifsc: 'HDFC0001234',
		utr: 'UTR202606271001'
	}),
	mkEntry('ent-4', 'rec-1001', '2026-06-27', 20_000),
	mkEntry('ent-5', 'rec-1002', '2026-06-21', 36_200),
	mkEntry('ent-6', 'rec-1003', '2026-06-14', 52_800),
	mkEntry('ent-7', 'rec-4001', '2026-06-29', 67_200),
	mkEntry('ent-8', 'rec-2002', '2026-06-20', 4_000, {
		utr: 'UTR20260518091234567'
	}),
	mkEntry('ent-9', 'rec-2002', '2026-06-20', 3_300, {
		accountNumber: '1122334455',
		ifsc: 'KOTAK001234',
		utr: 'UTR20260518091234568'
	}),
	mkEntry('ent-10', 'rec-2002', '2026-06-19', 4_100),
	mkEntry('ent-11', 'rec-2002', '2026-06-19', 3_600),
	mkEntry('ent-12', 'rec-2002', '2026-06-18', 3_900),
	mkEntry('ent-13', 'rec-2001', '2026-06-27', 4_500),
	mkEntry('ent-14', 'rec-2001', '2026-06-26', 3_900),
	mkEntry('ent-15', 'rec-2001', '2026-06-25', 4_200),
	mkEntry('ent-16', 'rec-2001', '2026-06-24', 3_800),
	mkEntry('ent-17', 'rec-2001', '2026-06-23', 5_500),
	mkEntry('ent-18', 'rec-2001', '2026-06-22', 5_500)
];

// ─── Query helpers ─────────────────────────────────────────────────────────────

export function getPartnerById(partnerId: string): Partner | undefined {
	return partners.find((partner) => partner.id === partnerId);
}

export function getMerchantById(merchantId: string): Merchant | undefined {
	return merchants.find((merchant) => merchant.id === merchantId);
}

export function getMerchantsByPartnerId(partnerId: string): Merchant[] {
	return merchants.filter((merchant) => merchant.partnerId === partnerId);
}

export function getRecordsByMerchantId(merchantId: string): SettlementRecord[] {
	return records
		.filter((record) => record.merchantId === merchantId)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		.map(resolveRecord);
}

export function getRecentRecordsByMerchantId(merchantId: string, limit = 5): SettlementRecord[] {
	return getRecordsByMerchantId(merchantId).slice(0, limit);
}

export function getMostRecentActionableRecord(merchantId: string): SettlementRecord | undefined {
	const sorted = getRecordsByMerchantId(merchantId);
	return (
		sorted.find((record) => record.status === 'unsettled' || record.status === 'partial') ??
		sorted[0]
	);
}

export function getRecordById(recordId: string): SettlementRecord | undefined {
	const record = records.find((item) => item.id === recordId);
	return record ? resolveRecord(record) : undefined;
}

export function getEntriesByRecordId(recordId: string): SettlementEntry[] {
	return entries
		.filter((entry) => entry.recordId === recordId)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function searchPartners(query: string): Partner[] {
	const normalized = query.trim().toLowerCase();
	if (!normalized) return partners;
	return partners.filter(
		(partner) =>
			partner.name.toLowerCase().includes(normalized) ||
			partner.code.toLowerCase().includes(normalized)
	);
}

// ─── Mutations (status derived after every change) ─────────────────────────────

export function addEntryToRecord(
	recordId: string,
	entry: Omit<SettlementEntry, 'id' | 'recordId'>,
	options?: { statusOverride?: SettlementStatus }
): SettlementEntry {
	const newEntry: SettlementEntry = {
		...entry,
		id: `ent-${Date.now()}`,
		recordId
	};
	entries.push(newEntry);
	syncRecordStatus(recordId);
	if (options?.statusOverride !== undefined) {
		setRecordStatus(recordId, options.statusOverride);
	}
	return newEntry;
}

export function updateEntryInRecord(
	entryId: string,
	updates: Partial<Omit<SettlementEntry, 'id' | 'recordId'>>
): SettlementEntry | undefined {
	const index = entries.findIndex((entry) => entry.id === entryId);
	if (index === -1) return undefined;

	const recordId = entries[index].recordId;
	entries[index] = { ...entries[index], ...updates };
	syncRecordStatus(recordId);
	return entries[index];
}

export function deleteEntryFromRecord(entryId: string): boolean {
	const index = entries.findIndex((entry) => entry.id === entryId);
	if (index === -1) return false;

	const recordId = entries[index].recordId;
	entries.splice(index, 1);
	syncRecordStatus(recordId);
	return true;
}

export function setRecordStatus(recordId: string, status: SettlementStatus): void {
	const record = records.find((item) => item.id === recordId);
	if (record) record.status = status;
}

// Sync all records on load so stored status matches entries
for (const record of records) {
	syncRecordStatus(record.id);
}
