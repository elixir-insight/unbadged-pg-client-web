export interface PayoutTableTypes {
	id?: string | number;
	beneficiaryName: string;
	crn: string;
	utr: number;
	clientOrderId: string;
	transactionAmount: string;
	createdAt: string;
	transactionType: string;
	transactionStatus: string;
}

export type PayoutResponseType = {
	statusCode: number;
	message: string;
	data: PayoutTableTypes[];
	pagination: {
		total: number;
		page: number;
		limit: number;
	};
};

export interface PayoutRow extends PayoutTableTypes, Record<string, unknown> {
	_dateMs: number;
}
