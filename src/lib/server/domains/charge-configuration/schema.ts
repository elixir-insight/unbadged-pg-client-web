import * as v from 'valibot';

const StringOrNumberSchema = v.union([v.string(), v.number()]);

export const ChargeConfigurationRecordSchema = v.object({
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

export const ListChargeConfigurationsResponseSchema = v.object({
	data: v.array(ChargeConfigurationRecordSchema),
	message: v.optional(v.string(), ''),
	statusCode: v.optional(v.number(), 200)
});

export type ChargeConfigurationRecord = v.InferOutput<typeof ChargeConfigurationRecordSchema>;
export type ListChargeConfigurationsResponse = v.InferOutput<
	typeof ListChargeConfigurationsResponseSchema
>;

export const CreateChargeConfigurationItemSchema = v.object({
	baseAmount: v.pipe(v.string(), v.trim(), v.minLength(1)),
	chargeRate: v.string(),
	chargeType: v.string(),
	gstExclusive: v.boolean(),
	gstPercentage: v.string(),
	methodConfigId: StringOrNumberSchema,
	pipelineCode: v.pipe(v.string(), v.trim(), v.minLength(1)),
	vaNumber: v.pipe(v.string(), v.trim(), v.minLength(1))
});

export const CreateChargeConfigurationsRequestSchema = v.object({
	chargeConfig: v.array(CreateChargeConfigurationItemSchema)
});

export const UpdateChargeConfigurationRequestSchema = v.object({
	baseAmount: v.pipe(v.string(), v.trim(), v.minLength(1)),
	chargeRate: v.string(),
	chargeType: v.string(),
	gstExclusive: v.boolean(),
	gstPercentage: v.string()
});

export const ChargeConfigurationMutationResponseSchema = v.object({
	data: v.optional(v.union([v.array(v.unknown()), v.string(), v.null()]), []),
	message: v.optional(v.string(), ''),
	statusCode: v.optional(v.number(), 200)
});

export type CreateChargeConfigurationItem = v.InferOutput<
	typeof CreateChargeConfigurationItemSchema
>;
export type CreateChargeConfigurationsRequest = v.InferOutput<
	typeof CreateChargeConfigurationsRequestSchema
>;
export type UpdateChargeConfigurationRequest = v.InferOutput<
	typeof UpdateChargeConfigurationRequestSchema
>;
export type ChargeConfigurationMutationResponse = v.InferOutput<
	typeof ChargeConfigurationMutationResponseSchema
>;
