import * as v from 'valibot';

const StringOrNumberSchema = v.union([v.string(), v.number()]);

const MerchantVirtualAccountRawSchema = v.object({
	createdAt: v.optional(v.nullable(v.string()), ''),
	createdBy: v.optional(v.nullable(StringOrNumberSchema)),
	dailyDepositLimit: v.optional(v.nullable(StringOrNumberSchema)),
	dailyTxnAmount: v.optional(v.nullable(StringOrNumberSchema)),
	dailyTxnLimit: v.optional(v.nullable(StringOrNumberSchema)),
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
	vaNumber: v.optional(v.nullable(v.string()), ''),
	virtualAccountNumber: v.optional(v.nullable(v.string()), '')
});

/** Accepts upstream `vaNumber` or `virtualAccountNumber` and normalizes to `virtualAccountNumber`. */
export const MerchantVirtualAccountSchema = v.pipe(
	MerchantVirtualAccountRawSchema,
	v.transform((account) => ({
		...account,
		virtualAccountNumber: account.virtualAccountNumber?.trim() || account.vaNumber?.trim() || ''
	}))
);

export const MerchantVirtualAccountsResponseSchema = v.object({
	data: v.array(MerchantVirtualAccountSchema),
	message: v.string(),
	statusCode: v.number()
});

export type MerchantVirtualAccount = v.InferOutput<typeof MerchantVirtualAccountSchema>;
export type MerchantVirtualAccountsResponse = v.InferOutput<
	typeof MerchantVirtualAccountsResponseSchema
>;

export const CreateVirtualAccountTxnTypeSchema = v.object({
	dailyTxnAmount: v.optional(v.string(), '0'),
	dailyTxnLimit: v.optional(v.string(), '0'),
	id: v.optional(v.number(), 0),
	transactionType: v.pipe(v.string(), v.trim(), v.minLength(1)),
	txnAmountMax: v.optional(v.string(), '0'),
	txnAmountMin: v.optional(v.string(), '0'),
	typeCode: v.number()
});

export const CreateVirtualAccountRequestSchema = v.object({
	allowedTxnTypes: v.array(CreateVirtualAccountTxnTypeSchema),
	dailyDepositLimit: v.string(),
	dailyTxnLimit: v.string(),
	isNonWhitelistedAllowed: v.boolean(),
	pipelineClass: v.string(),
	pipelineCode: v.string(),
	pipelineRole: v.string(),
	tps: v.number(),
	txnAmountMax: v.string(),
	txnAmountMin: v.string()
});

export const CreateVirtualAccountResponseSchema = v.object({
	data: v.optional(v.array(MerchantVirtualAccountSchema), []),
	message: v.optional(v.string(), ''),
	statusCode: v.optional(v.number(), 201)
});

export type CreateVirtualAccountRequest = v.InferOutput<typeof CreateVirtualAccountRequestSchema>;
export type CreateVirtualAccountResponse = v.InferOutput<typeof CreateVirtualAccountResponseSchema>;

/** Hardcoded payload used when auto-provisioning a PAYIN VAN during merchant activation. */
export const DEFAULT_ACTIVATE_VIRTUAL_ACCOUNT_REQUEST: CreateVirtualAccountRequest = {
	allowedTxnTypes: [
		{
			dailyTxnAmount: '0',
			dailyTxnLimit: '0',
			id: 0,
			transactionType: 'NET_BANKING',
			txnAmountMax: '0',
			txnAmountMin: '0',
			typeCode: 202
		}
	],
	dailyDepositLimit: '0',
	dailyTxnLimit: '0',
	isNonWhitelistedAllowed: true,
	pipelineClass: 'DIRECT',
	pipelineCode: 'TEST',
	pipelineRole: 'PAYIN',
	tps: 30,
	txnAmountMax: '0',
	txnAmountMin: '0'
};
