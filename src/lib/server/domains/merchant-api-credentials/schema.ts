import * as v from 'valibot';

export const MerchantApiCredentialItemSchema = v.object({
	id: v.union([v.string(), v.number()]),
	clientId: v.string(),
	// The backend does not return clientSecret on GET — kept optional defensively;
	// it must never be read from the list response even if present.
	clientSecret: v.optional(v.string())
});

export const MerchantApiCredentialListResponseSchema = v.object({
	data: v.array(MerchantApiCredentialItemSchema),
	message: v.string(),
	statusCode: v.number(),
	pagination: v.optional(v.unknown())
});

export const MerchantApiCredentialCreateResponseSchema = v.object({
	data: v.array(
		v.object({
			clientId: v.string(),
			clientSecret: v.string()
		})
	),
	message: v.string(),
	statusCode: v.number()
});

export const MerchantApiCredentialRevokeResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number()
});
