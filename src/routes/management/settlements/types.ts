export type SettlementStatus = 'completed' | 'pending';
export type TransactionType = 'sale' | 'refund' | 'chargeback';
export type SettlementTab = 'collections' | 'disbursements';

export interface SettlementListItem {
	merchantId: string;
	merchantName: string;
	settlementId: string;
	settlementDate: string; // ISO date
	saleAmount: number;
	deductions: number;
	netPayout: number;
	status: SettlementStatus;
	bankReference: string | null;
}

export interface OrderStats {
	orders: number;
	successful: number;
	pending: number;
	created: number;
	failed: number;
}

/** Money-level aggregates — sourced from the settlement service, not the orders service. */
export interface SettlementMoneySummary {
	totalSaleAmount: number;
	totalDeductions: number;
	netSettled: number;
	merchantsPending: number;
}

export interface SettlementTransaction {
	transactionId: string;
	orderId: string;
	type: TransactionType;
	grossAmount: number;
	tdrAmount: number;
	netAmount: number;
	paymentMode: string;
}

export interface SettlementDetail {
	settlementId: string;
	merchantId: string;
	merchantName: string;
	settlementDatetime: string; // ISO datetime
	bankReference: string;
	saleAmount: number;
	deductions: number;
	netPayout: number;
	status: SettlementStatus;
	orderStats: OrderStats;
	transactions: SettlementTransaction[];
}
