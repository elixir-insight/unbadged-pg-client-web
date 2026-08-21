import * as v from 'valibot';

export const PaymentOrderRedirectUrlSchema = v.object({
	successUrl: v.optional(v.nullable(v.string()), ''),
	cancelUrl: v.optional(v.nullable(v.string()), ''),
	failureUrl: v.optional(v.nullable(v.string()), '')
});

export const PaymentOrderListItemSchema = v.object({
	bankPipelineCode: v.optional(v.nullable(v.string()), ''),
	checkoutExpiry: v.optional(v.nullable(v.string()), ''),
	clientOrderId: v.optional(v.nullable(v.string()), ''),
	closedAt: v.optional(v.nullable(v.string()), ''),
	createdAt: v.optional(v.nullable(v.string()), ''),
	createdAtIst: v.optional(v.nullable(v.string()), ''),
	customerEmail: v.optional(v.nullable(v.string()), ''),
	customerName: v.optional(v.nullable(v.string()), ''),
	customerPhoneNumber: v.optional(v.nullable(v.string()), ''),
	description: v.optional(v.nullable(v.string()), ''),
	gatewayDescription: v.optional(v.nullable(v.string()), ''),
	id: v.optional(v.nullable(v.string()), ''),
	orderId: v.string(),
	orgId: v.optional(v.nullable(v.string()), ''),
	payinAttemptId: v.optional(v.nullable(v.string()), ''),
	paymentLink: v.optional(v.nullable(v.string()), ''),
	pipelineClass: v.optional(v.nullable(v.string()), ''),
	redirectUrl: v.optional(v.nullable(v.union([PaymentOrderRedirectUrlSchema, v.string()])), ''),
	allowedPaymentMethods: v.optional(v.nullable(v.array(v.string())), []),
	requestIpAddress: v.optional(v.nullable(v.string()), ''),
	status: v.string(),
	transactionAmount: v.string(),
	updatedAt: v.optional(v.nullable(v.string()), ''),
	vaIdentifier: v.optional(v.nullable(v.string()), ''),
	virtualAccountNumber: v.optional(v.nullable(v.string()), '')
});

export const PaymentOrderPaginationSchema = v.object({
	limit: v.number(),
	page: v.number(),
	total: v.number()
});

export const PaymentOrderListResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(PaymentOrderListItemSchema),
	pagination: v.optional(PaymentOrderPaginationSchema)
});

export const PaymentOrderCountsSchema = v.object({
	authorizedCount: v.number(),
	cancelledCount: v.number(),
	capturedCount: v.number(),
	createdCount: v.number(),
	expiredCount: v.number(),
	failedCount: v.number(),
	initiatedCount: v.number(),
	rejectedCount: v.number(),
	suspectedCount: v.number(),
	totalCount: v.number()
});

export const PaymentOrderCountsResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(PaymentOrderCountsSchema),
	pagination: v.optional(PaymentOrderPaginationSchema)
});

export const PaymentOrderTimelineItemSchema = v.object({
	amount: v.optional(v.nullable(v.string()), ''),
	clientOrderId: v.optional(v.nullable(v.string()), ''),
	createdAt: v.string(),
	eventAudience: v.optional(v.nullable(v.string()), ''),
	eventDescription: v.optional(v.nullable(v.string()), ''),
	eventTitle: v.string(),
	gatewayDescription: v.optional(v.nullable(v.string()), ''),
	orderId: v.string(),
	payinAttemptId: v.optional(v.nullable(v.string()), ''),
	paymentLink: v.optional(v.nullable(v.string()), ''),
	pipelineRefundId: v.optional(v.nullable(v.string()), ''),
	pipelineTransactionId: v.optional(v.nullable(v.string()), ''),
	refundId: v.optional(v.nullable(v.string()), ''),
	refundStatus: v.optional(v.nullable(v.string()), ''),
	settlementId: v.optional(v.nullable(v.string()), ''),
	status: v.string(),
	traceId: v.optional(v.nullable(v.string()), '')
});

export const PaymentOrderTimelineResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(PaymentOrderTimelineItemSchema),
	pagination: v.optional(PaymentOrderPaginationSchema)
});

export type PaymentOrderRedirectUrl = v.InferOutput<typeof PaymentOrderRedirectUrlSchema>;
export type PaymentOrderListItem = v.InferOutput<typeof PaymentOrderListItemSchema>;
export type PaymentOrderCounts = v.InferOutput<typeof PaymentOrderCountsSchema>;
export type PaymentOrderTimelineItem = v.InferOutput<typeof PaymentOrderTimelineItemSchema>;
