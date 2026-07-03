export type CommissionPaymentMethod = 'UPI' | 'Card' | 'NetBanking' | 'Wallet';

export type CommissionRecord = {
	id: string;
	merchantId: string;
	merchantName: string;
	transactionRef: string;
	paymentMethod: CommissionPaymentMethod;
	volume: number;
	commission: number;
	date: string;
};

export type CommissionMerchantOption = {
	value: string;
	label: string;
	description?: string;
};

export type FetchCommissionsParams = {
	date?: string;
	merchant?: string;
};

export type CommissionsSummary = {
	totalVolume: number;
	totalCommission: number;
	recordCount: number;
	effectiveRatePercent: number;
};

export type FetchCommissionsResponse = {
	records: CommissionRecord[];
	total: number;
	summary: CommissionsSummary;
	merchants: CommissionMerchantOption[];
	availableDates: string[];
};

export type RuleBreakdownRow = {
	slabLabel: string;
	ratePercent: number;
	volume: number;
	commission: number;
};
