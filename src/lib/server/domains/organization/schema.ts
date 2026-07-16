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

export const UpdateOrganizationAddressDetailsSchema = v.object({
	address: v.pipe(v.string(), v.trim(), v.minLength(1)),
	city: v.pipe(v.string(), v.trim(), v.minLength(1)),
	country: v.pipe(v.string(), v.trim(), v.minLength(1)),
	pinCode: v.pipe(v.string(), v.trim(), v.minLength(1)),
	state: v.pipe(v.string(), v.trim(), v.minLength(1))
});

export const UpdateOrganizationKybDetailsSchema = v.object({
	businessPan: v.pipe(v.string(), v.trim(), v.minLength(1)),
	businessPhone: v.pipe(v.string(), v.trim(), v.minLength(1)),
	cin: v.string(),
	communicationAddress: v.pipe(v.string(), v.trim(), v.minLength(1)),
	gstNumber: v.pipe(v.string(), v.trim(), v.minLength(1)),
	industry: v.pipe(v.string(), v.trim(), v.minLength(1)),
	organizationWebsite: v.pipe(v.string(), v.trim(), v.minLength(1)),
	registeredYear: v.pipe(v.number(), v.integer(), v.minValue(1800)),
	tan: v.string()
});

export const UpdateOrganizationKybRequestSchema = v.object({
	addressDetails: UpdateOrganizationAddressDetailsSchema,
	kyb: UpdateOrganizationKybDetailsSchema
});

export const UpdateOrganizationResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.union([v.array(v.unknown()), v.null()]))
});

export const AddOrganizationBankRequestSchema = v.object({
	accountNumber: v.pipe(v.string(), v.trim(), v.minLength(1)),
	accountType: v.pipe(v.string(), v.trim(), v.minLength(1)),
	bankName: v.pipe(v.string(), v.trim(), v.minLength(1)),
	branchName: v.pipe(v.string(), v.trim(), v.minLength(1)),
	holderName: v.pipe(v.string(), v.trim(), v.minLength(1)),
	ifscCode: v.pipe(v.string(), v.trim(), v.minLength(1)),
	status: v.pipe(v.string(), v.trim(), v.minLength(1))
});

/** Success shape varies; pagination is ignored when present. */
export const AddOrganizationBankResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.union([v.array(v.unknown()), v.unknown(), v.null()]))
});

export const UploadOrganizationDocumentsResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.union([v.array(v.unknown()), v.unknown(), v.null()]))
});

export const OrganizationDocumentRecordSchema = v.object({
	id: v.union([v.number(), v.string()]),
	fileName: v.pipe(v.string(), v.minLength(1)),
	fileType: v.optional(v.string()),
	fileSize: v.optional(v.number()),
	createdAt: v.optional(v.string()),
	preSignedUrl: v.optional(v.string())
});

export const GetOrganizationDocumentsResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.array(OrganizationDocumentRecordSchema))
});

/**
 * GET organization envelope — payload shape varies; map in map-get-response.ts.
 * Pagination is ignored when present.
 */
export const GetOrganizationResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.union([v.array(v.unknown()), v.unknown(), v.null()]))
});

export type CreateOrganizationRequest = v.InferOutput<typeof CreateOrganizationRequestSchema>;
export type CreateOrganizationResponse = v.InferOutput<typeof CreateOrganizationResponseSchema>;
export type UpdateOrganizationKybRequest = v.InferOutput<typeof UpdateOrganizationKybRequestSchema>;
export type UpdateOrganizationResponse = v.InferOutput<typeof UpdateOrganizationResponseSchema>;
export type AddOrganizationBankRequest = v.InferOutput<typeof AddOrganizationBankRequestSchema>;
export type AddOrganizationBankResponse = v.InferOutput<typeof AddOrganizationBankResponseSchema>;
export type UploadOrganizationDocumentsResponse = v.InferOutput<
	typeof UploadOrganizationDocumentsResponseSchema
>;
export type OrganizationDocumentRecord = v.InferOutput<typeof OrganizationDocumentRecordSchema>;
export type GetOrganizationDocumentsResponse = v.InferOutput<
	typeof GetOrganizationDocumentsResponseSchema
>;
export type GetOrganizationResponse = v.InferOutput<typeof GetOrganizationResponseSchema>;
