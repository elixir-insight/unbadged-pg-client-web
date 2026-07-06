import type { PartnerMerchantSummary, PartnerSettlementStatus } from './[merchantId]/types';

export type PartnerSettlementListSummary = {
	totalCommission: number;
	totalSettled: number;
	pendingAmount: number;
	unsettledCount: number;
};

export type PartnerSettlementStatusCounts = {
	all: number;
	unsettled: number;
	partial: number;
	settled: number;
	adjusted: number;
};

export type FetchPartnerSettlementsResponse = {
	merchants: PartnerMerchantSummary[];
	/** Full unfiltered-by-status/search list — lets the client recompute status card counts under a date filter. */
	allMerchants: PartnerMerchantSummary[];
	total: number;
	summary: PartnerSettlementListSummary;
	statusCounts: PartnerSettlementStatusCounts;
};

export type { PartnerSettlementStatus, PartnerMerchantSummary };
