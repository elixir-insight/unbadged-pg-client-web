import * as v from 'valibot';

export const ApiCredentialItemSchema = v.object({
	id: v.union([v.string(), v.number()]),
	clientId: v.string(),
	// The backend does not return clientSecret on GET — kept optional defensively;
	// it must never be read from the list response even if present.
	clientSecret: v.optional(v.string())
});

export const ApiCredentialListResponseSchema = v.object({
	data: v.array(ApiCredentialItemSchema),
	message: v.string(),
	statusCode: v.number(),
	pagination: v.optional(v.unknown())
});

export const ApiCredentialCreateResponseSchema = v.object({
	data: v.array(
		v.object({
			clientId: v.string(),
			clientSecret: v.string()
		})
	),
	message: v.string(),
	statusCode: v.number()
});

export const ApiCredentialRevokeResponseSchema = v.object({
	message: v.string(),
	statusCode: v.number()
});
