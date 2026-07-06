import type {
	FetchPartnerSettlementsResponse,
	PartnerMerchantSummary,
	PartnerSettlementStatusCounts
} from './types';
import {
	buildPartnerMerchantSummary,
	listPartnerMerchants,
	shouldSimulatePartnerSettlementsError
} from './[merchantId]/data';

// TEMP: dummy data until /partner/settlements API. Replace fetchPartnerSettlements() body only —
// keep the return type identical.

export type {
	FetchPartnerSettlementsResponse,
	PartnerSettlementListSummary,
	PartnerSettlementStatusCounts
} from './types';

function buildStatusCounts(summaries: PartnerMerchantSummary[]): PartnerSettlementStatusCounts {
	return {
		all: summaries.length,
		unsettled: summaries.filter((merchant) => merchant.status === 'unsettled').length,
		partial: summaries.filter((merchant) => merchant.status === 'partial').length,
		settled: summaries.filter((merchant) => merchant.status === 'settled').length,
		adjusted: summaries.filter((merchant) => merchant.status === 'adjusted').length
	};
}

export function fetchPartnerSettlements({
	search = '',
	status = '',
	searchField = 'name'
}: {
	search?: string;
	status?: string;
	searchField?: 'name' | 'id';
} = {}): Promise<FetchPartnerSettlementsResponse> {
	if (shouldSimulatePartnerSettlementsError(search)) {
		return Promise.reject(new Error('Simulated settlements fetch failure'));
	}

	return listPartnerMerchants().then(async (merchants) => {
		const summaries = await Promise.all(
			merchants.map((merchant) => buildPartnerMerchantSummary(merchant))
		);

		const statusCounts = buildStatusCounts(summaries);

		const normalizedSearch = search.trim().toLowerCase();
		let filtered = summaries;

		if (normalizedSearch) {
			filtered = filtered.filter((merchant) =>
				searchField === 'id'
					? merchant.id.toLowerCase().includes(normalizedSearch)
					: merchant.name.toLowerCase().includes(normalizedSearch)
			);
		}

		if (status) {
			filtered = filtered.filter((merchant) => merchant.status === status);
		}

		const totalCommission = filtered.reduce((sum, merchant) => sum + merchant.commissionEarned, 0);
		const totalSettled = filtered.reduce((sum, merchant) => sum + merchant.totalSettled, 0);
		const pendingAmount = filtered.reduce((sum, merchant) => sum + merchant.pendingAmount, 0);

		return {
			merchants: filtered,
			allMerchants: summaries,
			total: filtered.length,
			summary: {
				totalCommission,
				totalSettled,
				pendingAmount,
				unsettledCount: filtered.filter((merchant) => merchant.status === 'unsettled').length
			},
			statusCounts
		};
	});
}
