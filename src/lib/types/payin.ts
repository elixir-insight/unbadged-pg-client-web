export type PayinTransactionStatus = 'success' | 'pending' | 'failed';

export type PayinTimelineEntryType =
	| 'payment_created'
	| 'payment_initiated'
	| 'payment_attempted'
	| 'payment_authorized'
	| 'payment_completed'
	| 'payment_failed'
	| 'refund_initiated'
	| 'refund_completed'
	| 'refund_failed';

export interface PayinTimelineEntry {
	entryTitle: string;
	entryType: PayinTimelineEntryType;
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
	timestampMs: number;
	attemptNumber?: number;
	isCompleted: boolean;
}

export interface PayinDetail {
	txnId: string;
	customerName: string;
	customerEmail: string;
	customerPhoneNumber: string;
	transactionAmount: string;
	paymentMethod: string;
	paymentMode: string;
	paymentChannel: string;
	transactionStatus: PayinTransactionStatus;
	statusDescription: string;
	clientDescription: string;
	date: string;
	expiresAt: string;
	processingFee: string;
	gatewayFee: string;
	gatewayGst: string;
	commissionId: string;
	refundableAmount: string;
	orgId: string;
	partnerFee: string;
	partnerGst: string;
	vaIdentifier: string;
	affiliateId: string;
	crn: string;
	payerVpa: string;
	payeeVpa: string;
	orderId: string;
	virtualAccountNumber: string;
	bankPipelineCode: string;
	accountNumber: string;
	ifsc: string;
	transactionTimeline: PayinTimelineEntry[];
}
