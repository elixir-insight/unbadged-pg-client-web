export type InsightsMerchantStatus = 'active' | 'frozen' | 'hold';

export type InsightsMerchant = {
	id: string;
	name: string;
	status: InsightsMerchantStatus;
	[key: string]: string;
};

export type InsightsDaySummary = {
	/** ISO date `YYYY-MM-DD` */
	date: string;
	transactionCount: number;
	volume: number;
};
