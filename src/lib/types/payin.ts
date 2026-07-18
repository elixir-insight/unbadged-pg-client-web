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

export type PayinOrderStatus = 'created' | 'pending' | 'success' | 'failed' | 'expired';

export type PayinPaymentStatus = 'pending' | 'failed' | 'authorized' | 'success' | 'refunded';

export type PayinRefundStatus = 'initiated' | 'processing' | 'completed' | 'failed';

export type PayinRefundType = 'full' | 'partial';

export interface PayinRefundDetail {
	refundId: string;
	txnId: string;
	orderId: string;
	customerName: string;
	originalAmount: string;
	refundAmount: string;
	refundStatus: PayinRefundStatus;
	refundType: PayinRefundType;
	refundSpeed: string;
	refundMode: string;
	remark: string;
	createdAt: string;
	refundTimeline: PayinTimelineEntry[];
}

export interface PayinOrderListItem extends Record<string, unknown> {
	orderId: string;
	crn: string;
	customer: string;
	amount: string;
	status: PayinOrderStatus;
	attemptCount: number;
	createdAt: string;
	_dateMs: number;
}

export interface PayinOrderDetail {
	orderId: string;
	crn: string;
	customerName: string;
	customerEmail: string;
	customerPhoneNumber: string;
	orderAmount: string;
	orderStatus: PayinOrderStatus;
	statusDescription: string;
	clientDescription: string;
	createdAt: string;
	expiresAt: string;
	orderTimeline: PayinTimelineEntry[];
}

export interface PayinPaymentListItem extends Record<string, unknown> {
	txnId: string;
	orderId: string;
	customer: string;
	amount: string;
	paymentMethod: string;
	status: PayinPaymentStatus;
	attemptNumber: number;
	createdAt: string;
	_dateMs: number;
}

export interface PayinPaymentDetail {
	txnId: string;
	orderId: string;
	attemptNumber: number;
	customerName: string;
	transactionAmount: string;
	paymentMethod: string;
	paymentChannel: string;
	paymentStatus: PayinPaymentStatus;
	statusDescription: string;
	utr: string;
	bankRRN: string;
	cardNumber: string;
	cardType: string;
	errorDescription: string;
	payerVpa: string;
	bankPipelineCode: string;
	processingFee?: string;
	gatewayFee?: string;
	gatewayGst?: string;
	partnerFee?: string;
	partnerGst?: string;
	refundableAmount?: string;
	refunds?: PayinRefundDetail[];
	paymentTimeline: PayinTimelineEntry[];
}

export interface PayinOrderListResponse {
	data: PayinOrderListItem[];
	pagination: { total: number; page: number; limit: number };
}

export interface PayinOrderDetailResponse {
	data: PayinOrderDetail;
}

export interface PayinPaymentListResponse {
	data: PayinPaymentListItem[];
	pagination: { total: number; page: number; limit: number };
}

export interface PayinPaymentDetailResponse {
	data: PayinPaymentDetail;
}

/** @deprecated Use PayinOrderDetail and PayinPaymentDetail instead */
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
