export type PartnerSettlementStatus = 'unsettled' | 'partial' | 'settled' | 'adjusted';

export type PartnerSettlementEntry = {
	id: string;
	merchantId: string;
	date: string;
	amount: number;
	tds: number;
	gst: number;
	accountNumber: string;
	ifsc: string;
	utr: string;
};

export type PartnerMerchant = {
	id: string;
	name: string;
	city: string;
	commissionEarned: number;
};

export type PartnerMerchantSummary = PartnerMerchant & {
	totalSettled: number;
	pendingAmount: number;
	status: PartnerSettlementStatus;
	lastSettlementDate: string | null;
	entriesCount: number;
};
