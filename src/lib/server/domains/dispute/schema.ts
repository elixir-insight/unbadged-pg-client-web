import * as v from 'valibot';

export const DISPUTE_SOURCES = ['AGGREGATOR_MANUAL', 'BANK_MANUAL'] as const;
export type DisputeSource = (typeof DISPUTE_SOURCES)[number];

export const CreateDisputeRequestSchema = v.object({
	actorType: v.optional(v.literal('user'), 'user'),
	amount: v.pipe(v.string(), v.trim(), v.minLength(1, 'Amount is required')),
	assignedTo: v.pipe(v.string(), v.trim(), v.minLength(1, 'Assignee is required')),
	currency: v.optional(v.literal('INR'), 'INR'),
	orderId: v.pipe(v.string(), v.trim(), v.minLength(1, 'Order ID is required')),
	pipelineTransactionId: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, 'Pipeline transaction ID is required')
	),
	source: v.picklist(DISPUTE_SOURCES),
	status: v.optional(v.literal('DISPUTE_RAISED'), 'DISPUTE_RAISED')
});

export const CreateDisputeItemSchema = v.object({
	disputeId: v.string(),
	status: v.string()
});

export const CreateDisputeResponseSchema = v.object({
	data: v.optional(v.array(CreateDisputeItemSchema), []),
	message: v.optional(v.string(), ''),
	pagination: v.optional(
		v.object({
			limit: v.optional(v.number(), 0),
			page: v.optional(v.number(), 0),
			total: v.optional(v.number(), 0)
		})
	),
	statusCode: v.optional(v.number(), 201)
});

export type CreateDisputeRequest = v.InferOutput<typeof CreateDisputeRequestSchema>;
export type CreateDisputeResponse = v.InferOutput<typeof CreateDisputeResponseSchema>;

const OptionalStringSchema = v.optional(v.nullable(v.string()), '');
const OptionalStringOrNumberSchema = v.optional(v.nullable(v.union([v.string(), v.number()])), '');

export const DisputePaginationSchema = v.object({
	limit: v.number(),
	page: v.number(),
	total: v.number()
});

export const DisputeListItemSchema = v.object({
	amount: OptionalStringSchema,
	assignedAt: OptionalStringSchema,
	assignedBy: OptionalStringOrNumberSchema,
	assignedTo: OptionalStringOrNumberSchema,
	bankRefNumber: OptionalStringSchema,
	createdAt: OptionalStringSchema,
	currency: OptionalStringSchema,
	disputeId: v.string(),
	evidenceDueBy: OptionalStringSchema,
	gatewayDescription: OptionalStringSchema,
	notifiedAt: OptionalStringSchema,
	orderId: OptionalStringSchema,
	orgId: OptionalStringSchema,
	pipelineCode: OptionalStringSchema,
	pipelineDescription: OptionalStringSchema,
	pipelineTransactionId: OptionalStringSchema,
	raisedBy: OptionalStringOrNumberSchema,
	reasonCode: OptionalStringSchema,
	resolutionNotes: OptionalStringSchema,
	resolvedAt: OptionalStringSchema,
	resolvedBy: OptionalStringOrNumberSchema,
	source: OptionalStringSchema,
	status: OptionalStringSchema,
	updatedAt: OptionalStringSchema
});

export const DisputeListResponseSchema = v.object({
	data: v.array(DisputeListItemSchema),
	message: v.optional(v.string(), ''),
	pagination: v.optional(DisputePaginationSchema, { limit: 10, page: 0, total: 0 }),
	statusCode: v.optional(v.number(), 200)
});

export type DisputeListItem = v.InferOutput<typeof DisputeListItemSchema>;
export type DisputeListResponse = v.InferOutput<typeof DisputeListResponseSchema>;
export type DisputePagination = v.InferOutput<typeof DisputePaginationSchema>;

export const DisputeEventItemSchema = v.object({
	id: OptionalStringOrNumberSchema,
	disputeId: OptionalStringSchema,
	fromStatus: OptionalStringSchema,
	toStatus: OptionalStringSchema,
	actorType: OptionalStringSchema,
	actorId: OptionalStringOrNumberSchema,
	note: OptionalStringSchema,
	createdAt: OptionalStringSchema
});

export const DisputeEventsResponseSchema = v.object({
	data: v.optional(v.array(DisputeEventItemSchema), []),
	message: v.optional(v.string(), ''),
	pagination: v.optional(DisputePaginationSchema, { limit: 10, page: 0, total: 0 }),
	statusCode: v.optional(v.number(), 200)
});

export type DisputeEventItem = v.InferOutput<typeof DisputeEventItemSchema>;
export type DisputeEventsResponse = v.InferOutput<typeof DisputeEventsResponseSchema>;

export const DisputeStatusItemSchema = v.object({
	status: v.string(),
	description: OptionalStringSchema
});

export const DisputeStatusesResponseSchema = v.object({
	data: v.optional(v.array(DisputeStatusItemSchema), []),
	message: v.optional(v.string(), ''),
	pagination: v.optional(DisputePaginationSchema, { limit: 10, page: 0, total: 0 }),
	statusCode: v.optional(v.number(), 200)
});

export type DisputeStatusItem = v.InferOutput<typeof DisputeStatusItemSchema>;
export type DisputeStatusesResponse = v.InferOutput<typeof DisputeStatusesResponseSchema>;

export const UpdateDisputeStatusRequestSchema = v.object({
	fromStatus: v.optional(v.string(), ''),
	toStatus: v.pipe(v.string(), v.trim(), v.minLength(1, 'Status is required')),
	actorType: v.optional(v.literal('user'), 'user'),
	note: v.optional(v.string(), '')
});

export const UpdateDisputeStatusResponseSchema = v.object({
	data: v.optional(v.array(DisputeEventItemSchema), []),
	message: v.optional(v.string(), ''),
	statusCode: v.optional(v.number(), 200)
});

export type UpdateDisputeStatusRequest = v.InferOutput<typeof UpdateDisputeStatusRequestSchema>;
export type UpdateDisputeStatusResponse = v.InferOutput<typeof UpdateDisputeStatusResponseSchema>;

const OptionalTrimmedStringSchema = v.optional(v.pipe(v.string(), v.trim()));

export const UpdateDisputeRequestSchema = v.pipe(
	v.object({
		bankRefNumber: OptionalTrimmedStringSchema,
		evidenceDueBy: OptionalTrimmedStringSchema,
		gatewayDescription: OptionalTrimmedStringSchema,
		pipelineDescription: OptionalTrimmedStringSchema,
		reasonCode: OptionalTrimmedStringSchema,
		resolutionNotes: OptionalTrimmedStringSchema,
		status: OptionalTrimmedStringSchema
	}),
	v.check(
		(value) =>
			value.bankRefNumber !== undefined ||
			value.evidenceDueBy !== undefined ||
			value.gatewayDescription !== undefined ||
			value.pipelineDescription !== undefined ||
			value.reasonCode !== undefined ||
			value.resolutionNotes !== undefined ||
			value.status !== undefined,
		'No changes to update'
	)
);

export const UpdateDisputeResponseSchema = v.object({
	data: v.optional(v.array(CreateDisputeItemSchema), []),
	message: v.optional(v.string(), ''),
	pagination: v.optional(DisputePaginationSchema, { limit: 10, page: 0, total: 0 }),
	statusCode: v.optional(v.number(), 200)
});

export type UpdateDisputeRequest = v.InferOutput<typeof UpdateDisputeRequestSchema>;
export type UpdateDisputeResponse = v.InferOutput<typeof UpdateDisputeResponseSchema>;

export const DISPUTE_DOCUMENT_TYPES = [
	'MERCHANT_PROOF',
	'AGGREGATOR_CORRESPONDENCE',
	'FINAL_RESOLUTION_DOC'
] as const;
export type DisputeDocumentType = (typeof DISPUTE_DOCUMENT_TYPES)[number];

export const DisputeDocumentItemSchema = v.object({
	documentId: v.string(),
	disputeId: OptionalStringSchema,
	documentType: OptionalStringSchema,
	fileName: OptionalStringSchema,
	fileSizeBytes: v.optional(v.nullable(v.number()), 0),
	mimeType: OptionalStringSchema,
	uploadedByRole: OptionalStringSchema,
	uploadedById: OptionalStringSchema,
	visibleToMerchant: v.optional(v.nullable(v.boolean()), false),
	version: v.optional(v.nullable(v.number()), 0),
	reviewStatus: OptionalStringSchema,
	reviewNote: OptionalStringSchema,
	reviewedBy: OptionalStringSchema,
	reviewedAt: OptionalStringSchema,
	createdAt: OptionalStringSchema
});

export const DisputeDocumentUploadFailureSchema = v.object({
	fileName: OptionalStringSchema,
	reason: OptionalStringSchema
});

export const DisputeDocumentUploadResultSchema = v.object({
	uploaded: v.optional(v.nullable(v.array(DisputeDocumentItemSchema)), []),
	failed: v.optional(v.nullable(v.array(DisputeDocumentUploadFailureSchema)), [])
});

export const UploadDisputeDocumentsResponseSchema = v.object({
	data: v.optional(v.array(DisputeDocumentUploadResultSchema), []),
	message: v.optional(v.string(), ''),
	pagination: v.optional(DisputePaginationSchema, { limit: 10, page: 0, total: 0 }),
	statusCode: v.optional(v.number(), 201)
});

export type DisputeDocumentItem = v.InferOutput<typeof DisputeDocumentItemSchema>;
export type DisputeDocumentUploadFailure = v.InferOutput<typeof DisputeDocumentUploadFailureSchema>;
export type UploadDisputeDocumentsResponse = v.InferOutput<
	typeof UploadDisputeDocumentsResponseSchema
>;

const OptionalDocumentListSchema = v.optional(v.nullable(v.array(DisputeDocumentItemSchema)), []);

export const DisputeDocumentsGroupedSchema = v.object({
	merchantProof: OptionalDocumentListSchema,
	aggregatorCorrespondence: OptionalDocumentListSchema,
	finalResolutionDoc: OptionalDocumentListSchema
});

export const GetDisputeDocumentsResponseSchema = v.object({
	data: v.optional(v.array(DisputeDocumentsGroupedSchema), []),
	message: v.optional(v.string(), ''),
	pagination: v.optional(DisputePaginationSchema, { limit: 10, page: 0, total: 0 }),
	statusCode: v.optional(v.number(), 200)
});

export type DisputeDocumentsGrouped = v.InferOutput<typeof DisputeDocumentsGroupedSchema>;
export type GetDisputeDocumentsResponse = v.InferOutput<typeof GetDisputeDocumentsResponseSchema>;

const OptionalTrimmedReviewStringSchema = v.optional(v.pipe(v.string(), v.trim()));

export const UpdateDisputeDocumentRequestSchema = v.pipe(
	v.object({
		reviewNote: OptionalTrimmedReviewStringSchema,
		reviewStatus: OptionalTrimmedReviewStringSchema,
		visibleToMerchant: v.optional(v.boolean())
	}),
	v.check(
		(value) =>
			value.reviewNote !== undefined ||
			value.reviewStatus !== undefined ||
			value.visibleToMerchant !== undefined,
		'No document fields to update'
	)
);

export const UpdateDisputeDocumentResponseSchema = v.object({
	data: v.optional(v.array(v.record(v.string(), v.unknown())), []),
	message: v.optional(v.string(), ''),
	pagination: v.optional(DisputePaginationSchema, { limit: 10, page: 0, total: 0 }),
	statusCode: v.optional(v.number(), 200)
});

export type UpdateDisputeDocumentRequest = v.InferOutput<typeof UpdateDisputeDocumentRequestSchema>;
export type UpdateDisputeDocumentResponse = v.InferOutput<
	typeof UpdateDisputeDocumentResponseSchema
>;

export const DeleteDisputeDocumentResponseSchema = v.object({
	data: v.optional(v.array(v.record(v.string(), v.unknown())), []),
	message: v.optional(v.string(), ''),
	pagination: v.optional(DisputePaginationSchema, { limit: 10, page: 0, total: 0 }),
	statusCode: v.optional(v.number(), 200)
});

export type DeleteDisputeDocumentResponse = v.InferOutput<
	typeof DeleteDisputeDocumentResponseSchema
>;
