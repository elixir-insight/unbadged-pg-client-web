import * as v from 'valibot';

const StringOrNumberSchema = v.union([v.string(), v.number()]);

export const PaymentMethodConfigurationRecordSchema = v.object({
	createdAt: v.optional(v.nullable(v.string())),
	updatedAt: v.optional(v.nullable(v.string())),
	effectiveFrom: v.optional(v.nullable(v.string())),
	effectiveTo: v.optional(v.nullable(v.string())),
	pipelineCode: v.pipe(v.string(), v.trim(), v.minLength(1)),
	serviceType: v.pipe(v.string(), v.trim(), v.minLength(1)),
	instrument: v.pipe(v.string(), v.trim(), v.minLength(1)),
	paymentRail: v.pipe(v.string(), v.trim(), v.minLength(1)),
	description: v.optional(v.string(), ''),
	id: StringOrNumberSchema,
	createdBy: v.optional(v.nullable(StringOrNumberSchema)),
	updatedBy: v.optional(v.nullable(StringOrNumberSchema))
});

export const ListPaymentMethodConfigurationsResponseSchema = v.object({
	data: v.array(PaymentMethodConfigurationRecordSchema),
	message: v.optional(v.string(), ''),
	statusCode: v.optional(v.number(), 200)
});

export type PaymentMethodConfigurationRecord = v.InferOutput<
	typeof PaymentMethodConfigurationRecordSchema
>;
export type ListPaymentMethodConfigurationsResponse = v.InferOutput<
	typeof ListPaymentMethodConfigurationsResponseSchema
>;
