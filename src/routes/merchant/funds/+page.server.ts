import type { PageServerLoad } from './$types';
import type { FundSummary } from '$lib/types/funds';
import { BANK_ACCOUNTS, VIRTUAL_ACCOUNTS, ALL_TRANSACTIONS } from '$lib/server/funds';

export const load: PageServerLoad = async ({ url }) => {
	const skip = Number(url.searchParams.get('skip') ?? 0);
	const limit = Number(url.searchParams.get('limit') ?? 10);
	const search = url.searchParams.get('search')?.trim() ?? '';
	const searchField = url.searchParams.get('field') ?? 'crn';
	const status = url.searchParams.get('status')?.trim() ?? '';
	const fromDate = url.searchParams.get('fromDate') ?? '';
	const toDate = url.searchParams.get('toDate') ?? '';

	let filtered = ALL_TRANSACTIONS;

	if (status) {
		filtered = filtered.filter((t) => t.status.toLowerCase() === status.toLowerCase());
	}
	if (fromDate) {
		const from = new Date(fromDate).getTime();
		filtered = filtered.filter((t) => new Date(t.dateTime).getTime() >= from);
	}
	if (toDate) {
		const to = new Date(toDate);
		to.setHours(23, 59, 59, 999);
		filtered = filtered.filter((t) => new Date(t.dateTime).getTime() <= to.getTime());
	}
	if (search) {
		const q = search.toLowerCase();
		filtered = filtered.filter((t) => {
			if (searchField === 'utr') return t.utr?.toLowerCase().includes(q);
			if (searchField === 'txnId') return t.txnId.toLowerCase().includes(q);
			return t.crn.toLowerCase().includes(q);
		});
	}

	const summary: FundSummary = {
		totalBalance: 4_750_000,
		payInBalance: 3_200_000,
		payoutBalance: 1_550_000,
		lastUpdated: new Date('2026-07-02T10:30:00Z').toISOString()
	};

	return {
		summary,
		bankAccounts: BANK_ACCOUNTS,
		virtualAccounts: VIRTUAL_ACCOUNTS,
		recentTransactions: ALL_TRANSACTIONS.slice(0, 5),
		totalTransactionCount: ALL_TRANSACTIONS.length,
		transactions: filtered.slice(skip, skip + limit),
		total: filtered.length,
		skip,
		limit
	};
};
