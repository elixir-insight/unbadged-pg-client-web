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
