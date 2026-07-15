import * as v from 'valibot';

export const OrganizationProfileTypeSchema = v.picklist(['MERCHANT', 'PARTNER']);
export const OrganizationBusinessTypeSchema = v.picklist([
	'SOLE_PROPRIETORSHIP',
	'PARTNERSHIP',
	'LIMITED_LIABILITY_PARTNERSHIP',
	'PRIVATE_LIMITED'
]);
export const OrganizationServiceTypeCodeSchema = v.picklist(['PAYIN', 'PAYOUT']);

export const CreateOrganizationServiceTypeSchema = v.object({
	serviceType: OrganizationServiceTypeCodeSchema,
	bankPipelineCodes: v.array(v.pipe(v.string(), v.minLength(1)))
});

export const CreateOrganizationRequestSchema = v.object({
	legalCompanyName: v.pipe(v.string(), v.trim(), v.minLength(1)),
	businessType: OrganizationBusinessTypeSchema,
	phoneNumber: v.pipe(v.string(), v.trim(), v.minLength(1)),
	userEmail: v.pipe(v.string(), v.trim(), v.email()),
	profileType: OrganizationProfileTypeSchema,
	affiliateId: v.nullable(v.string()),
	serviceTypes: v.array(CreateOrganizationServiceTypeSchema)
});

/**
 * Upstream envelopes vary; keep the response flexible and extract an id when present.
 * Success shape: { data: [{ orgId, ... }], message, statusCode: 201 }
 */
export const CreatedOrganizationDataSchema = v.object({
	orgId: v.optional(v.string()),
	organizationId: v.optional(v.string()),
	id: v.optional(v.string()),
	legalCompanyName: v.optional(v.string()),
	userEmail: v.optional(v.string()),
	phoneNumber: v.optional(v.string()),
	businessType: v.optional(v.string()),
	profileType: v.optional(v.string())
});

export const CreateOrganizationResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(
		v.union([
			v.array(CreatedOrganizationDataSchema),
			CreatedOrganizationDataSchema,
			v.string(),
			v.null()
		])
	)
});

export type CreateOrganizationRequest = v.InferOutput<typeof CreateOrganizationRequestSchema>;
export type CreateOrganizationResponse = v.InferOutput<typeof CreateOrganizationResponseSchema>;
