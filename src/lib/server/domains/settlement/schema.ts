import * as v from 'valibot';

export const LastSettlementSchema = v.object({
	amount: v.string(),
	settlementDatetime: v.string(),
	settlementId: v.string()
});

export const SettlementOverviewDataSchema = v.object({
	awaitingSettlementAmount: v.string(),
	lastSettlement: v.optional(v.nullable(LastSettlementSchema), null),
	totalSettledAmount: v.string()
});

export const SettlementOverviewResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	/** Upstream wraps the overview payload in a single-element array. */
	data: v.array(SettlementOverviewDataSchema)
});

export const SettlementApiStatusSchema = v.picklist(['PENDING', 'SETTLED', 'FAILED']);

export const SettlementListItemSchema = v.object({
	accountNumber: v.optional(v.nullable(v.string()), ''),
	bankPipelineCode: v.optional(v.nullable(v.string()), ''),
	bankReference: v.optional(v.nullable(v.string()), ''),
	chargebackAmount: v.optional(v.nullable(v.string()), '0'),
	correctedAt: v.optional(v.nullable(v.string()), ''),
	createdAt: v.optional(v.nullable(v.string()), ''),
	description: v.optional(v.nullable(v.string()), ''),
	destinationBank: v.optional(v.nullable(v.string()), ''),
	grossAmount: v.string(),
	ifsc: v.optional(v.nullable(v.string()), ''),
	legalCompanyName: v.optional(v.nullable(v.string()), ''),
	netSettledAmount: v.string(),
	orgId: v.optional(v.nullable(v.string()), ''),
	pipelineSettlementId: v.optional(v.nullable(v.string()), ''),
	refundAmount: v.optional(v.nullable(v.string()), '0'),
	settlementDatetime: v.optional(v.nullable(v.string()), ''),
	settlementId: v.string(),
	status: v.string()
});

export const SettlementPaginationSchema = v.object({
	total: v.number(),
	page: v.number(),
	limit: v.number()
});

export const SettlementListResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(SettlementListItemSchema),
	pagination: SettlementPaginationSchema
});

export const SettlementDetailItemSchema = v.object({
	bankPipelineCode: v.optional(v.nullable(v.string()), ''),
	createdAt: v.optional(v.nullable(v.string()), ''),
	description: v.optional(v.nullable(v.string()), ''),
	grossTransactionAmount: v.string(),
	id: v.string(),
	netSettlementAmount: v.string(),
	orderId: v.optional(v.nullable(v.string()), ''),
	orgId: v.optional(v.nullable(v.string()), ''),
	payinAttemptId: v.optional(v.nullable(v.string()), ''),
	settlementDatetime: v.optional(v.nullable(v.string()), ''),
	settlementId: v.optional(v.nullable(v.string()), ''),
	taxOnTdrAmount: v.optional(v.nullable(v.string()), '0'),
	tdrAmount: v.optional(v.nullable(v.string()), '0'),
	tdrFixedFee: v.optional(v.nullable(v.string()), '0'),
	tdrPaidByMerchantPercent: v.optional(v.nullable(v.string()), ''),
	tdrPercent: v.optional(v.nullable(v.string()), '')
});

export const SettlementDetailsResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(SettlementDetailItemSchema),
	pagination: SettlementPaginationSchema
});

export type LastSettlement = v.InferOutput<typeof LastSettlementSchema>;
export type SettlementOverviewData = v.InferOutput<typeof SettlementOverviewDataSchema>;
export type SettlementOverviewResponse = v.InferOutput<typeof SettlementOverviewResponseSchema>;
export type SettlementApiStatus = v.InferOutput<typeof SettlementApiStatusSchema>;
export type SettlementListItem = v.InferOutput<typeof SettlementListItemSchema>;
export type SettlementListResponse = v.InferOutput<typeof SettlementListResponseSchema>;
export type SettlementPagination = v.InferOutput<typeof SettlementPaginationSchema>;
export type SettlementDetailItem = v.InferOutput<typeof SettlementDetailItemSchema>;
export type SettlementDetailsResponse = v.InferOutput<typeof SettlementDetailsResponseSchema>;
