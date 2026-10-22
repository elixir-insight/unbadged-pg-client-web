import * as v from 'valibot';

export const OrganizationProfileTypeSchema = v.picklist(['MERCHANT', 'PARTNER', 'PLATFORM']);
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
	businessPan: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1))),
	businessPhone: v.pipe(v.string(), v.trim(), v.minLength(1)),
	cin: v.string(),
	communicationAddress: v.pipe(v.string(), v.trim(), v.minLength(1)),
	gstNumber: v.pipe(v.string(), v.trim(), v.minLength(1)),
	industry: v.pipe(v.string(), v.trim(), v.minLength(1)),
	organizationWebsite: v.pipe(v.string(), v.trim(), v.minLength(1)),
	registeredYear: v.pipe(v.number(), v.integer(), v.minValue(1800)),
	tan: v.string()
});

export const UpdateOrganizationDirectorSchema = v.object({
	aadhar: v.optional(
		v.pipe(
			v.string(),
			v.transform((value) => value.replace(/\D/g, '')),
			v.minLength(12),
			v.check((value) => /^[2-9]\d{11}$/.test(value), 'Enter a valid 12-digit Aadhar number')
		)
	),
	email: v.pipe(v.string(), v.trim(), v.email()),
	id: v.optional(v.union([v.number(), v.string()])),
	name: v.pipe(v.string(), v.trim(), v.minLength(1)),
	pan: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1))),
	phoneNumber: v.pipe(v.string(), v.trim(), v.minLength(1))
});

export const UpdateOrganizationKybRequestSchema = v.object({
	addressDetails: UpdateOrganizationAddressDetailsSchema,
	brandName: v.optional(v.pipe(v.string(), v.trim())),
	directors: v.array(UpdateOrganizationDirectorSchema),
	kyb: UpdateOrganizationKybDetailsSchema
});

export const UpdateOrganizationResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.union([v.array(v.unknown()), v.null()]))
});

/** DELETE /api/v1/management/onboard/organization/{orgId}/directors/{directorId} */
export const DeleteDirectorResponseSchema = UpdateOrganizationResponseSchema;

export const OrganizationProfileStatusSchema = v.picklist([
	'APPROVED',
	'ACTIVE',
	'ON_HOLD',
	'FROZEN',
	'IN_PROGRESS',
	'REJECTED',
	'REMARKED'
]);

export const UpdateOrganizationStatusRequestSchema = v.object({
	profileStatus: OrganizationProfileStatusSchema,
	remarks: v.string()
});

/** Success envelope; pagination is ignored when present. */
export const UpdateOrganizationStatusResponseSchema = v.object({
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

/** Director document records — upstream may use `documentId` instead of `id`. Pagination is ignored. */
export const OrganizationDirectorDocumentRecordSchema = v.object({
	documentId: v.optional(v.union([v.number(), v.string()])),
	id: v.optional(v.union([v.number(), v.string()])),
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

export const GetDirectorDocumentsResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.array(OrganizationDirectorDocumentRecordSchema))
});

export const OrganizationBankAccountRecordSchema = v.object({
	id: v.optional(v.union([v.number(), v.string()])),
	accountId: v.optional(v.union([v.number(), v.string()])),
	bankAccountId: v.optional(v.union([v.number(), v.string()])),
	holderName: v.optional(v.string()),
	accountHolderName: v.optional(v.string()),
	accountNumber: v.optional(v.string()),
	ifscCode: v.optional(v.string()),
	bankName: v.optional(v.string()),
	branchName: v.optional(v.string()),
	branch: v.optional(v.string()),
	accountType: v.optional(v.string()),
	status: v.optional(v.string()),
	createdAt: v.optional(v.string()),
	updatedAt: v.optional(v.string()),
	createdBy: v.optional(v.number()),
	updatedBy: v.optional(v.number())
});

export const GetOrganizationBankAccountsResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.array(OrganizationBankAccountRecordSchema))
});

export const OrganizationDetailsDirectorRecordSchema = v.object({
	id: v.optional(v.union([v.number(), v.string()])),
	name: v.optional(v.string()),
	pan: v.optional(v.string()),
	email: v.optional(v.string()),
	phoneNumber: v.optional(v.string()),
	aadhar: v.optional(v.string())
});

export const OrganizationDetailsAddressSchema = v.object({
	address: v.optional(v.string()),
	city: v.optional(v.string()),
	country: v.optional(v.string()),
	pinCode: v.optional(v.string()),
	state: v.optional(v.string())
});

export const OrganizationDetailsRecordSchema = v.object({
	orgId: v.optional(v.string()),
	legalCompanyName: v.optional(v.string()),
	businessType: v.optional(v.string()),
	profileType: v.optional(v.string()),
	profileStatus: v.optional(v.string()),
	phoneNumber: v.optional(v.string()),
	email: v.optional(v.string()),
	businessPhone: v.optional(v.string()),
	cin: v.optional(v.string()),
	orgPan: v.optional(v.string()),
	orgTan: v.optional(v.string()),
	gstNumber: v.optional(v.string()),
	industry: v.optional(v.string()),
	organizationWebsite: v.optional(v.string()),
	registeredYear: v.optional(v.number()),
	brandName: v.optional(v.string()),
	communicationAddress: v.optional(v.string()),
	serviceTypes: v.optional(v.array(v.string())),
	address: v.optional(OrganizationDetailsAddressSchema),
	addressDetails: v.optional(OrganizationDetailsAddressSchema),
	kyb: v.optional(v.unknown()),
	directors: v.optional(v.array(OrganizationDetailsDirectorRecordSchema))
});

/**
 * GET organization envelope — payload shape varies; map in mappers/from-api/get-organization.ts.
 * Pagination is ignored when present.
 */
export const GetOrganizationResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.union([v.array(v.unknown()), v.unknown(), v.null()]))
});

/** GET organization details — KYB fields and directors; map in mappers/from-api/get-organization.ts. */
export const GetOrganizationDetailsResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.union([v.array(v.unknown()), v.unknown(), v.null()]))
});

export const OrganizationProfileRecordSchema = v.object({
	orgId: v.string(),
	companyName: v.string(),
	orgName: v.string(),
	email: v.string(),
	phone: v.string(),
	businessType: v.string(),
	country: v.string(),
	registeredDate: v.string(),
	website: v.string(),
	username: v.string(),
	gstNumber: v.optional(v.nullable(v.string()), '')
});

/** PATCH /api/v1/management/onboard/organization/{orgId}/profile — set during KYB approval. */
export const UpdateOrganizationProfileRequestSchema = v.object({
	profileType: OrganizationProfileTypeSchema,
	serviceTypes: v.optional(v.array(CreateOrganizationServiceTypeSchema)),
	affiliateId: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1)))
});

export const UpdateOrganizationProfileResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.unknown())
});

/** GET /api/v1/management/organizations/{orgId}/sensitive-data — decrypted PAN / Aadhaar. Shape of `data` is read leniently. */
export const GetOrganizationSensitiveDataResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.unknown())
});

export type SensitiveDataQuery =
	| { entityType: 'onboarding'; field: 'pan' }
	| { entityType: 'director'; field: 'pan' | 'aadhar'; entityId: string };

export const GetOrganizationProfileResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.array(OrganizationProfileRecordSchema)
});

export const DashboardMerchantVirtualAccountSchema = v.object({
	bankPipelineCode: v.optional(v.nullable(v.string()), ''),
	createdAt: v.optional(v.nullable(v.string()), ''),
	createdBy: v.optional(v.nullable(v.string()), ''),
	dailyDepositAmount: v.optional(v.nullable(v.string()), ''),
	dailyDepositLimit: v.optional(v.nullable(v.string()), ''),
	dailyTxnAmount: v.optional(v.nullable(v.string()), ''),
	dailyTxnLimit: v.optional(v.nullable(v.string()), ''),
	deletedAt: v.optional(v.nullable(v.string()), ''),
	id: v.union([v.string(), v.number()]),
	isNonWhitelistedAllowed: v.optional(v.nullable(v.boolean()), false),
	orgId: v.optional(v.nullable(v.string()), ''),
	pipelineClass: v.optional(v.nullable(v.string()), ''),
	pipelineRoles: v.optional(v.nullable(v.string()), ''),
	status: v.optional(v.nullable(v.string()), ''),
	tps: v.optional(v.nullable(v.number()), 0),
	txnAmountMax: v.optional(v.nullable(v.string()), ''),
	txnAmountMin: v.optional(v.nullable(v.string()), ''),
	updatedAt: v.optional(v.nullable(v.string()), ''),
	updatedBy: v.optional(v.nullable(v.string()), ''),
	vaIdentifier: v.optional(v.nullable(v.union([v.string(), v.number()]))),
	virtualAccountNumber: v.string()
});

export const DashboardMerchantSchema = v.object({
	affiliateId: v.optional(v.nullable(v.string()), ''),
	businessType: v.optional(v.nullable(v.string()), ''),
	createdAt: v.optional(v.nullable(v.string()), ''),
	createdBy: v.optional(v.nullable(v.string()), ''),
	deletedAt: v.optional(v.nullable(v.string()), ''),
	displayOrgId: v.pipe(v.string(), v.trim(), v.minLength(1)),
	email: v.optional(v.nullable(v.string()), ''),
	legalCompanyName: v.optional(v.nullable(v.string()), ''),
	phoneNumber: v.optional(v.nullable(v.string()), ''),
	profileDescription: v.optional(v.nullable(v.string()), ''),
	profileStatus: v.optional(v.nullable(v.string()), ''),
	profileType: v.optional(v.nullable(v.string()), ''),
	serviceTypes: v.optional(v.array(v.string()), []),
	updatedAt: v.optional(v.nullable(v.string()), ''),
	updatedBy: v.optional(v.nullable(v.string()), ''),
	virtualAccounts: v.optional(v.array(DashboardMerchantVirtualAccountSchema), [])
});

export const GetDashboardMerchantsResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.array(DashboardMerchantSchema)
});

export type CreateOrganizationRequest = v.InferOutput<typeof CreateOrganizationRequestSchema>;
export type CreateOrganizationResponse = v.InferOutput<typeof CreateOrganizationResponseSchema>;
export type UpdateOrganizationKybRequest = v.InferOutput<typeof UpdateOrganizationKybRequestSchema>;
export type UpdateOrganizationResponse = v.InferOutput<typeof UpdateOrganizationResponseSchema>;
export type DeleteDirectorResponse = v.InferOutput<typeof DeleteDirectorResponseSchema>;
export type UpdateOrganizationStatusRequest = v.InferOutput<
	typeof UpdateOrganizationStatusRequestSchema
>;
export type UpdateOrganizationStatusResponse = v.InferOutput<
	typeof UpdateOrganizationStatusResponseSchema
>;
export type AddOrganizationBankRequest = v.InferOutput<typeof AddOrganizationBankRequestSchema>;
export type AddOrganizationBankResponse = v.InferOutput<typeof AddOrganizationBankResponseSchema>;
export type UploadOrganizationDocumentsResponse = v.InferOutput<
	typeof UploadOrganizationDocumentsResponseSchema
>;
export type OrganizationDocumentRecord = v.InferOutput<typeof OrganizationDocumentRecordSchema>;
export type OrganizationDirectorDocumentRecord = v.InferOutput<
	typeof OrganizationDirectorDocumentRecordSchema
>;
export type GetOrganizationDocumentsResponse = v.InferOutput<
	typeof GetOrganizationDocumentsResponseSchema
>;
export type GetDirectorDocumentsResponse = v.InferOutput<typeof GetDirectorDocumentsResponseSchema>;
export type OrganizationBankAccountRecord = v.InferOutput<
	typeof OrganizationBankAccountRecordSchema
>;
export type GetOrganizationBankAccountsResponse = v.InferOutput<
	typeof GetOrganizationBankAccountsResponseSchema
>;
export type GetOrganizationResponse = v.InferOutput<typeof GetOrganizationResponseSchema>;
export type OrganizationDetailsRecord = v.InferOutput<typeof OrganizationDetailsRecordSchema>;
export type GetOrganizationDetailsResponse = v.InferOutput<
	typeof GetOrganizationDetailsResponseSchema
>;
export type UpdateOrganizationProfileRequest = v.InferOutput<
	typeof UpdateOrganizationProfileRequestSchema
>;
export type OrganizationProfileRecord = v.InferOutput<typeof OrganizationProfileRecordSchema>;
export type GetOrganizationProfileResponse = v.InferOutput<
	typeof GetOrganizationProfileResponseSchema
>;
export type DashboardMerchantVirtualAccount = v.InferOutput<
	typeof DashboardMerchantVirtualAccountSchema
>;
export type DashboardMerchant = v.InferOutput<typeof DashboardMerchantSchema>;
export type GetDashboardMerchantsResponse = v.InferOutput<
	typeof GetDashboardMerchantsResponseSchema
>;

export const OrganizationTableProfileStatusSchema = v.picklist([
	'IN_PROGRESS',
	'IN_REVIEW',
	'REMARKED',
	'APPROVED',
	'ACTIVE',
	'ON_HOLD',
	'FROZEN',
	'REJECTED'
]);

export const OrganizationTableRecordSchema = v.object({
	id: v.pipe(v.string(), v.minLength(1)),
	name: v.pipe(v.string(), v.minLength(1)),
	businessType: v.pipe(v.string(), v.minLength(1)),
	category: v.pipe(v.string(), v.minLength(1)),
	createdAt: v.pipe(v.string(), v.minLength(1)),
	profileStatus: v.pipe(v.string(), v.minLength(1))
});

export const OrganizationTablePaginationSchema = v.object({
	limit: v.number(),
	page: v.number(),
	total: v.number()
});

export const OrganizationTableStatusCountItemSchema = v.object({
	status: v.pipe(v.string(), v.minLength(1)),
	count: v.number()
});

/** Upstream returns statusCounts as `{ status, count }[]`; keep record shape as fallback. */
export const GetOrganizationsTableResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.array(OrganizationTableRecordSchema)),
	pagination: v.optional(OrganizationTablePaginationSchema),
	statusCounts: v.optional(
		v.union([v.array(OrganizationTableStatusCountItemSchema), v.record(v.string(), v.number())])
	),
	totalPages: v.optional(v.number()),
	counts: v.optional(v.unknown())
});

export type OrganizationTableRecord = v.InferOutput<typeof OrganizationTableRecordSchema>;
export type OrganizationTablePagination = v.InferOutput<typeof OrganizationTablePaginationSchema>;
export type GetOrganizationsTableResponse = v.InferOutput<
	typeof GetOrganizationsTableResponseSchema
>;
