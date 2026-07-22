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

/** Nested txn-type restriction on create. Extra swagger fields omitted until needed. */
export const CreateVirtualAccountTxnTypeSchema = v.object({
	transactionType: v.pipe(v.string(), v.trim(), v.minLength(1)),
	typeCode: v.number()
});

export const CreateVirtualAccountRequestSchema = v.object({
	allowedTxnTypes: v.array(CreateVirtualAccountTxnTypeSchema),
	dailyDepositLimit: v.string(),
	dailyTxnLimit: v.string(),
	pipelineClass: v.string(),
	pipelineCode: v.string(),
	pipelineRole: v.string(),
	tps: v.number(),
	txnAmountMax: v.string(),
	txnAmountMin: v.string()
});

export const CreateVirtualAccountResponseSchema = v.object({
	data: v.optional(v.union([v.string(), v.null()])),
	message: v.optional(v.string()),
	statusCode: v.optional(v.number())
});

export type CreateVirtualAccountRequest = v.InferOutput<typeof CreateVirtualAccountRequestSchema>;
export type CreateVirtualAccountResponse = v.InferOutput<typeof CreateVirtualAccountResponseSchema>;

/** Temporary hardcoded payload used after profile activation. */
export const DEFAULT_ACTIVATE_VIRTUAL_ACCOUNT_REQUEST: CreateVirtualAccountRequest = {
	pipelineCode: 'TEST',
	pipelineRole: 'PAYIN',
	pipelineClass: 'FACILITATED',
	dailyTxnLimit: '200000',
	txnAmountMin: '0',
	dailyDepositLimit: '2000000',
	txnAmountMax: '2000000',
	allowedTxnTypes: [
		{ transactionType: 'UPI', typeCode: 200 },
		{ transactionType: 'CARD', typeCode: 201 },
		{ transactionType: 'NET_BANKING', typeCode: 202 }
	],
	tps: 30
};
