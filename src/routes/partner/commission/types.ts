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
	dateFrom?: string;
	dateTo?: string;
	merchant?: string;
	paymentMethod?: string;
	search?: string;
	searchField?: 'transactionRef' | 'merchant';
};

export type CommissionsSummary = {
	totalVolume: number;
	totalCommission: number;
	recordCount: number;
	effectiveRatePercent: number;
};

export type CommissionPaymentMethodCounts = Record<CommissionPaymentMethod, number> & {
	all: number;
};

export type FetchCommissionsResponse = {
	records: CommissionRecord[];
	total: number;
	summary: CommissionsSummary;
	merchants: CommissionMerchantOption[];
	availableDates: string[];
	paymentMethodCounts: CommissionPaymentMethodCounts;
};

export type RuleBreakdownRow = {
	slabLabel: string;
	ratePercent: number;
	volume: number;
	commission: number;
};
