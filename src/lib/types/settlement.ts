export type SettlementStatus = 'settled' | 'processing' | 'failed';

export interface FeeBreakdown {
	rate: number;
	processingFee: number;
	gst: number;
	totalFee: number;
}

export interface SettlementOrder {
	id: string;
	description: string;
	amount: number;
	fee: number;
	netAmount: number;
	adjusted?: { reason: string };
	feeBreakdown: FeeBreakdown;
}

export interface SettledTo {
	bankName: string;
	accountLast4: string;
}

/** Set when refunds/chargebacks on orders outside the current page break a clean
 * order-subtotal vs. net-amount reconciliation — see settlement details footer. */
export interface ReconciliationGap {
	note: string;
}

export interface Settlement {
	id: string;
	utr: string | null;
	status: SettlementStatus;
	settledOn: string | null;
	expectedOn: string | null;
	settledTo: SettledTo;
	grossAmount: number;
	refundsAndChargebacks: number;
	fees: number;
	netAmount: number;
	transactionCount: number;
	orders: SettlementOrder[];
	reconciliationGap?: ReconciliationGap;
}

export type OnDemandStatus = 'settled' | 'processing' | 'failed';

export interface OnDemandSettlement {
	id: string;
	requestedOn: string;
	settledOn: string | null;
	status: OnDemandStatus;
	amount: number;
	fee: number;
	netAmount: number;
	utr: string | null;
}

export interface AccountSettlementConfig {
	domesticLeadTimeText: string;
	internationalLeadTimeText: string;
	instantSettlementEligible: boolean;
	availableBalance: number;
}
