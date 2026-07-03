import type { PartnerMerchantSummary, PartnerSettlementStatus } from './[merchantId]/types';

export type PartnerSettlementListSummary = {
	totalCommission: number;
	totalSettled: number;
	pendingAmount: number;
	unsettledCount: number;
};

export type FetchPartnerSettlementsResponse = {
	merchants: PartnerMerchantSummary[];
	total: number;
	summary: PartnerSettlementListSummary;
};

export type { PartnerSettlementStatus, PartnerMerchantSummary };
