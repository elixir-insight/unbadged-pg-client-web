import * as v from 'valibot';

export const PaymentAttemptItemSchema = v.object({
	accountNumber: v.optional(v.nullable(v.string()), ''),
	affiliateId: v.optional(v.nullable(v.string()), ''),
	bankPipelineCode: v.optional(v.nullable(v.string()), ''),
	bankRrn: v.optional(v.nullable(v.string()), ''),
	clientDescription: v.optional(v.nullable(v.string()), ''),
	clientOrderId: v.optional(v.nullable(v.string()), ''),
	closingWalletBalance: v.optional(v.nullable(v.string()), ''),
	commissionId: v.optional(v.nullable(v.string()), ''),
	createdAt: v.optional(v.nullable(v.string()), ''),
	createdAtIst: v.optional(v.nullable(v.string()), ''),
	disputeId: v.optional(v.nullable(v.string()), ''),
	gatewayDescription: v.optional(v.nullable(v.string()), ''),
	gatewayFee: v.optional(v.nullable(v.string()), ''),
	gatewayGst: v.optional(v.nullable(v.string()), ''),
	id: v.optional(v.nullable(v.string()), ''),
	ifsc: v.optional(v.nullable(v.string()), ''),
	orderId: v.optional(v.nullable(v.string()), ''),
	orgId: v.optional(v.nullable(v.string()), ''),
	partnerFee: v.optional(v.nullable(v.string()), ''),
	partnerGst: v.optional(v.nullable(v.string()), ''),
	payeeVpa: v.optional(v.nullable(v.string()), ''),
	payerVpa: v.optional(v.nullable(v.string()), ''),
	payinAttemptId: v.string(),
	paymentChannel: v.optional(v.nullable(v.string()), ''),
	paymentMethod: v.optional(v.nullable(v.string()), ''),
	paymentMode: v.optional(v.nullable(v.string()), ''),
	pipelineClass: v.optional(v.nullable(v.string()), ''),
	pipelineTransactionId: v.optional(v.nullable(v.string()), ''),
	processingFee: v.optional(v.nullable(v.string()), ''),
	refundInitiated: v.optional(v.boolean(), false),
	refundableAmount: v.optional(v.nullable(v.string()), ''),
	settlementId: v.optional(v.nullable(v.string()), ''),
	statusDescription: v.optional(v.nullable(v.string()), ''),
	transactionAmount: v.string(),
	transactionStatus: v.string(),
	updatedAt: v.optional(v.nullable(v.string()), ''),
	utrNo: v.optional(v.nullable(v.string()), ''),
	vaIdentifier: v.optional(v.nullable(v.string()), ''),
	virtualAccountNumber: v.optional(v.nullable(v.string()), '')
});

export const PaymentAttemptPaginationSchema = v.object({
	limit: v.number(),
	page: v.number(),
	total: v.number()
});

export const PaymentAttemptListResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(PaymentAttemptItemSchema),
	pagination: PaymentAttemptPaginationSchema
});

export type PaymentAttemptItem = v.InferOutput<typeof PaymentAttemptItemSchema>;
export type PaymentAttemptListResponse = v.InferOutput<typeof PaymentAttemptListResponseSchema>;
