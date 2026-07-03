import type { FetchPartnerSettlementsResponse } from './types';
import {
	buildPartnerMerchantSummary,
	listPartnerMerchants,
	shouldSimulatePartnerSettlementsError
} from './[merchantId]/data';

// TEMP: dummy data until /partner/settlements API. Replace fetchPartnerSettlements() body only —
// keep the return type identical.

export type { FetchPartnerSettlementsResponse, PartnerSettlementListSummary } from './types';

export function fetchPartnerSettlements({
	search = ''
}: { search?: string } = {}): Promise<FetchPartnerSettlementsResponse> {
	if (shouldSimulatePartnerSettlementsError(search)) {
		return Promise.reject(new Error('Simulated settlements fetch failure'));
	}

	return listPartnerMerchants().then(async (merchants) => {
		const normalizedSearch = search.trim().toLowerCase();
		const filteredMerchants = normalizedSearch
			? merchants.filter(
					(merchant) =>
						merchant.name.toLowerCase().includes(normalizedSearch) ||
						merchant.id.toLowerCase().includes(normalizedSearch) ||
						merchant.city.toLowerCase().includes(normalizedSearch)
				)
			: merchants;

		const summaries = await Promise.all(
			filteredMerchants.map((merchant) => buildPartnerMerchantSummary(merchant))
		);

		const totalCommission = summaries.reduce((sum, merchant) => sum + merchant.commissionEarned, 0);
		const totalSettled = summaries.reduce((sum, merchant) => sum + merchant.totalSettled, 0);
		const pendingAmount = summaries.reduce((sum, merchant) => sum + merchant.pendingAmount, 0);

		return {
			merchants: summaries,
			total: summaries.length,
			summary: {
				totalCommission,
				totalSettled,
				pendingAmount,
				unsettledCount: summaries.filter((merchant) => merchant.status === 'unsettled').length
			}
		};
	});
}
