import * as v from 'valibot';

export const PipelineRoleSchema = v.picklist(['PAYIN', 'PAYOUT']);

export const PipelineSchema = v.object({
	id: v.number(),
	bankPipelineCode: v.pipe(v.string(), v.minLength(1)),
	name: v.string(),
	allowedTransactionTypes: v.optional(v.array(v.string()), [])
});

export const ListPipelinesResponseSchema = v.object({
	data: v.array(PipelineSchema),
	message: v.optional(v.string()),
	statusCode: v.optional(v.number())
});

export type PipelineRole = v.InferOutput<typeof PipelineRoleSchema>;
export type Pipeline = v.InferOutput<typeof PipelineSchema>;
export type ListPipelinesResponse = v.InferOutput<typeof ListPipelinesResponseSchema>;
