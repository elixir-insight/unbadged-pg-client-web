import * as v from 'valibot';

const StringOrNumberSchema = v.union([v.string(), v.number()]);

export const MerchantVirtualAccountSchema = v.object({
	createdAt: v.optional(v.nullable(v.string()), ''),
	createdBy: v.optional(v.nullable(StringOrNumberSchema)),
	dailyDepositLimit: v.optional(v.nullable(StringOrNumberSchema)),
	dailyTxnAmount: v.optional(v.nullable(StringOrNumberSchema)),
	dailyTxnLimit: v.optional(v.nullable(StringOrNumberSchema)),
	id: StringOrNumberSchema,
	isNonWhitelistedAllowed: v.optional(v.nullable(v.boolean()), false),
	pipelineClass: v.optional(v.nullable(v.string()), ''),
	pipelineCode: v.optional(v.nullable(v.string()), ''),
	pipelineRole: v.string(),
	status: v.optional(v.nullable(v.string()), ''),
	tps: v.optional(v.nullable(v.number()), 0),
	txnAmountMax: v.optional(v.nullable(StringOrNumberSchema)),
	txnAmountMin: v.optional(v.nullable(StringOrNumberSchema)),
	updatedAt: v.optional(v.nullable(v.string()), ''),
	updatedBy: v.optional(v.nullable(StringOrNumberSchema)),
	virtualAccountNumber: v.string()
});

export const MerchantVirtualAccountsResponseSchema = v.object({
	data: v.array(MerchantVirtualAccountSchema),
	message: v.string(),
	statusCode: v.number()
});

export type MerchantVirtualAccount = v.InferOutput<typeof MerchantVirtualAccountSchema>;
export type MerchantVirtualAccountsResponse = v.InferOutput<
	typeof MerchantVirtualAccountsResponseSchema
>;
