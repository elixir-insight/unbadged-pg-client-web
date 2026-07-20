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
	orgId: string;
	vanId: string;
	vanNumber: string;
	merchantName: string;
}

export type PayoutTransactionStatus = 'success' | 'pending' | 'failed';

export interface PayoutTimelineEntry {
	entryTitle: string;
	entryType: string;
	entryDescription: string;
	txnAmount: string;
	refundAmount: string;
	transactionStatus: string;
	paymentMethod: string;
	paymentChannel: string;
	crn: string;
	utr: string;
	bankRRN: string;
	cardNumber: string;
	cardType: string;
	transactionMessage: string;
	errorDescription: string;
	refundId: string;
	refundSpeed: string;
	refundMode: string;
	refundType: string;
	remark: string;
	timestamp: string;
	isCompleted: boolean;
}

export interface PayoutDetail {
	clientOrderId: string;
	beneficiaryName: string;
	beneficiaryEmail: string;
	beneficiaryPhoneNumber: string;
	accountNumber: string;
	ifsc: string;
	bankName: string;
	transactionAmount: string;
	transactionType: string;
	transactionStatus: PayoutTransactionStatus;
	statusDescription: string;
	clientDescription: string;
	createdAt: string;
	processingFee: string;
	gatewayFee: string;
	gatewayGst: string;
	netDebited: string;
	orgId: string;
	vanId: string;
	vanNumber: string;
	merchantName: string;
	crn: string;
	utr: string;
	bankPipelineCode: string;
	transactionTimeline: PayoutTimelineEntry[];
}
