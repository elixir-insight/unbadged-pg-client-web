import * as v from 'valibot';

const StringOrNumberSchema = v.union([v.string(), v.number()]);

/** Upstream commission configuration record — same shape as charge configurations. */
export const CommissionConfigurationRecordSchema = v.object({
	baseAmount: v.optional(v.nullable(StringOrNumberSchema), ''),
	chargeRate: v.optional(v.nullable(StringOrNumberSchema), ''),
	chargeType: v.optional(v.nullable(v.string()), ''),
	createdAt: v.optional(v.nullable(v.string())),
	createdBy: v.optional(v.nullable(StringOrNumberSchema)),
	effectiveFrom: v.optional(v.nullable(v.string()), ''),
	effectiveTo: v.optional(v.nullable(v.string()), ''),
	gstExclusive: v.optional(v.boolean(), false),
	gstPercentage: v.optional(v.nullable(v.string()), ''),
	id: StringOrNumberSchema,
	methodConfigId: StringOrNumberSchema,
	pipelineCode: v.optional(v.nullable(v.string()), ''),
	updatedAt: v.optional(v.nullable(v.string())),
	updatedBy: v.optional(v.nullable(StringOrNumberSchema)),
	vaNumber: v.optional(v.nullable(v.string()), '')
});

export const ListCommissionConfigurationsResponseSchema = v.object({
	data: v.array(CommissionConfigurationRecordSchema),
	message: v.optional(v.string(), ''),
	statusCode: v.optional(v.number(), 200)
});

export type CommissionConfigurationRecord = v.InferOutput<
	typeof CommissionConfigurationRecordSchema
>;
export type ListCommissionConfigurationsResponse = v.InferOutput<
	typeof ListCommissionConfigurationsResponseSchema
>;

export const CreateCommissionConfigurationItemSchema = v.object({
	baseAmount: v.pipe(v.string(), v.trim(), v.minLength(1)),
	commissionType: v.string(),
	feeRate: v.string(),
	gstExclusive: v.boolean(),
	gstPercentage: v.string(),
	methodConfigId: StringOrNumberSchema,
	pipelineCode: v.pipe(v.string(), v.trim(), v.minLength(1)),
	vaNumber: v.pipe(v.string(), v.trim(), v.minLength(1))
});

export const CreateCommissionConfigurationsRequestSchema = v.object({
	commissionConfig: v.array(CreateCommissionConfigurationItemSchema)
});

export const CommissionConfigurationMutationResponseSchema = v.object({
	data: v.optional(v.union([v.array(v.unknown()), v.string(), v.null()]), []),
	message: v.optional(v.string(), ''),
	statusCode: v.optional(v.number(), 200)
});

export type CreateCommissionConfigurationItem = v.InferOutput<
	typeof CreateCommissionConfigurationItemSchema
>;
export type CreateCommissionConfigurationsRequest = v.InferOutput<
	typeof CreateCommissionConfigurationsRequestSchema
>;
export type CommissionConfigurationMutationResponse = v.InferOutput<
	typeof CommissionConfigurationMutationResponseSchema
>;
