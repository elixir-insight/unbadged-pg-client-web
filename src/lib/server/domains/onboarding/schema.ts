import * as v from 'valibot';

// Every onboarding endpoint's success envelope is `{ data, message, pagination, statusCode }`.
// `pagination` is never consumed by any caller so it's left untyped/ignored, same as the
// management-onboarding schemas' treatment of fields nobody reads. Response shapes here are kept
// permissive (fields optional, ids aliased across likely casings) rather than a strict contract —
// unlike the outgoing request schemas, which we fully control and can validate tightly — because
// the real backend shape has never been confirmed against a live response (see extract.ts's prior
// v.unknown() usage). A too-strict response schema would reject a whole call over one unexpected
// or missing field; that's the failure mode to avoid until the shapes below are confirmed live.

const PaginationSchema = v.optional(
	v.object({
		limit: v.optional(v.number()),
		page: v.optional(v.number()),
		total: v.optional(v.number())
	})
);

// ── 1. GET /organization ────────────────────────────────────────────────

export const OrganizationAddressSchema = v.object({
	address: v.optional(v.string()),
	address2: v.optional(v.string()),
	city: v.optional(v.string()),
	country: v.optional(v.string()),
	pinCode: v.optional(v.string()),
	state: v.optional(v.string())
});

export const OrganizationDirectorRecordSchema = v.object({
	id: v.optional(v.union([v.number(), v.string()])),
	name: v.optional(v.string()),
	pan: v.optional(v.string()),
	email: v.optional(v.string()),
	phoneNumber: v.optional(v.string()),
	aadhar: v.optional(v.string())
});

export const GetOrganizationRecordSchema = v.object({
	orgId: v.optional(v.string()),
	profileStatus: v.optional(v.string()),
	profileType: v.optional(v.string()),
	legalCompanyName: v.optional(v.string()),
	businessType: v.optional(v.string()),
	brandName: v.optional(v.string()),
	orgPan: v.optional(v.string()),
	gstNumber: v.optional(v.string()),
	cin: v.optional(v.string()),
	orgTan: v.optional(v.string()),
	email: v.optional(v.string()),
	phoneNumber: v.optional(v.string()),
	businessPhone: v.optional(v.string()),
	organizationWebsite: v.optional(v.string()),
	industry: v.optional(v.string()),
	communicationAddress: v.optional(v.string()),
	registeredYear: v.optional(v.number()),
	serviceTypes: v.optional(v.array(v.string())),
	address: v.optional(OrganizationAddressSchema),
	directors: v.optional(v.array(OrganizationDirectorRecordSchema)),
	verifications: v.optional(v.record(v.string(), v.string()))
});

export const GetOrganizationResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	pagination: PaginationSchema,
	// Documented as `data: GetOrganizationResponse[]` — always treat as a single org, data[0].
	data: v.optional(v.union([v.array(GetOrganizationRecordSchema), v.null()]))
});

// ── 2. PUT /organization ────────────────────────────────────────────────

export const UpdateOrganizationAddressDetailsSchema = v.object({
	address: v.pipe(v.string(), v.trim(), v.minLength(1)),
	address2: v.optional(v.string()),
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

export const UpdateOrganizationDirectorSchema = v.object({
	id: v.optional(v.union([v.number(), v.string()])),
	name: v.pipe(v.string(), v.trim(), v.minLength(1)),
	pan: v.pipe(v.string(), v.trim(), v.minLength(1)),
	aadhar: v.pipe(v.string(), v.trim(), v.minLength(1)),
	email: v.pipe(v.string(), v.trim(), v.email()),
	phoneNumber: v.pipe(v.string(), v.trim(), v.minLength(1))
});

export const UpdateOrganizationRequestSchema = v.object({
	addressDetails: UpdateOrganizationAddressDetailsSchema,
	brandName: v.optional(v.string()),
	directors: v.array(UpdateOrganizationDirectorSchema),
	kyb: UpdateOrganizationKybDetailsSchema
});

/** Same section shapes echoed back — never treat as authoritative beyond ids (see extract.ts). */
export const UpdateOrganizationResponseSectionSchema = v.object({
	addressDetails: v.optional(UpdateOrganizationAddressDetailsSchema),
	directors: v.optional(v.array(OrganizationDirectorRecordSchema)),
	kyb: v.optional(v.unknown())
});

export const UpdateOrganizationResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	pagination: PaginationSchema,
	data: v.optional(v.union([v.array(UpdateOrganizationResponseSectionSchema), v.null()]))
});

// ── 3 & 5. POST /organization/bank, PUT /organization/bank/{accountId} ────

export const BankAccountRequestSchema = v.object({
	accountNumber: v.pipe(v.string(), v.trim(), v.minLength(1)),
	accountType: v.pipe(v.string(), v.trim(), v.minLength(1)),
	bankName: v.pipe(v.string(), v.trim(), v.minLength(1)),
	branchName: v.pipe(v.string(), v.trim(), v.minLength(1)),
	holderName: v.pipe(v.string(), v.trim(), v.minLength(1)),
	ifscCode: v.pipe(v.string(), v.trim(), v.minLength(1))
});

export const CreatedBankAccountRecordSchema = v.object({
	accountId: v.optional(v.union([v.number(), v.string()])),
	accountNumber: v.optional(v.string()),
	accountType: v.optional(v.string()),
	bankName: v.optional(v.string()),
	branchName: v.optional(v.string()),
	holderName: v.optional(v.string()),
	ifscCode: v.optional(v.string()),
	status: v.optional(v.string())
});

export const CreateBankAccountResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	pagination: PaginationSchema,
	data: v.optional(v.union([v.array(CreatedBankAccountRecordSchema), v.null()]))
});

/** PUT bank response has never echoed a usable body (`data: [{}]` per contract) — id unchanged. */
export const UpdateBankAccountResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	pagination: PaginationSchema,
	data: v.optional(v.unknown())
});

// ── 4. GET /organization/bank-accounts ──────────────────────────────────

export const BankAccountRecordSchema = v.object({
	id: v.optional(v.union([v.number(), v.string()])),
	accountNumber: v.optional(v.string()),
	accountType: v.optional(v.string()),
	bankName: v.optional(v.string()),
	branchName: v.optional(v.string()),
	holderName: v.optional(v.string()),
	ifscCode: v.optional(v.string()),
	status: v.optional(v.string()),
	createdAt: v.optional(v.string()),
	createdBy: v.optional(v.string()),
	updatedAt: v.optional(v.string()),
	updatedBy: v.optional(v.string())
});

export const GetBankAccountsResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	pagination: PaginationSchema,
	data: v.optional(v.union([v.array(BankAccountRecordSchema), v.null()]))
});

// ── 6. DELETE /organization/directors/{directorId} ──────────────────────

export const DeleteDirectorResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	pagination: PaginationSchema,
	data: v.optional(v.string())
});

// ── 7 & 9. GET director/org documents ───────────────────────────────────

export const DocumentRecordSchema = v.object({
	id: v.optional(v.union([v.number(), v.string()])),
	documentId: v.optional(v.union([v.number(), v.string()])),
	fileName: v.optional(v.string()),
	fileSize: v.optional(v.number()),
	fileType: v.optional(v.string()),
	createdAt: v.optional(v.string()),
	preSignedUrl: v.optional(v.string())
});

export const GetDocumentsResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	pagination: PaginationSchema,
	data: v.optional(v.union([v.array(DocumentRecordSchema), v.null()]))
});

// ── 8 & 10. POST director/org documents ─────────────────────────────────

export const UploadDocumentRecordSchema = v.object({
	documentId: v.optional(v.union([v.number(), v.string()])),
	fileName: v.optional(v.string()),
	fileSize: v.optional(v.number()),
	fileType: v.optional(v.string())
});

export const UploadDocumentsResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	pagination: PaginationSchema,
	data: v.optional(v.union([v.array(UploadDocumentRecordSchema), v.null()]))
});

// ── 11. POST /organization/submit ───────────────────────────────────────

export const SubmitOnboardingResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	pagination: PaginationSchema,
	data: v.optional(v.string())
});

// ── Error envelope — documented shape; not yet observed live (see client.ts's apiFetch, which
// currently reads a single `exceptionCode`/`message`, not this array). Kept for reference only;
// nothing parses this yet, since inventing a parser for an unconfirmed shape risks masking the
// real one apiFetch already extracts.
export const OnboardingApiErrorSchema = v.object({
	errors: v.optional(v.array(v.object({ code: v.optional(v.string()) })))
});

// ── Inferred types ───────────────────────────────────────────────────────

export type GetOrganizationRecord = v.InferOutput<typeof GetOrganizationRecordSchema>;
export type GetOrganizationResponse = v.InferOutput<typeof GetOrganizationResponseSchema>;
export type UpdateOrganizationRequest = v.InferOutput<typeof UpdateOrganizationRequestSchema>;
export type UpdateOrganizationResponse = v.InferOutput<typeof UpdateOrganizationResponseSchema>;
export type BankAccountRequest = v.InferOutput<typeof BankAccountRequestSchema>;
export type CreateBankAccountResponse = v.InferOutput<typeof CreateBankAccountResponseSchema>;
export type UpdateBankAccountResponse = v.InferOutput<typeof UpdateBankAccountResponseSchema>;
export type BankAccountRecord = v.InferOutput<typeof BankAccountRecordSchema>;
export type GetBankAccountsResponse = v.InferOutput<typeof GetBankAccountsResponseSchema>;
export type DeleteDirectorResponse = v.InferOutput<typeof DeleteDirectorResponseSchema>;
export type DocumentRecord = v.InferOutput<typeof DocumentRecordSchema>;
export type GetDocumentsResponse = v.InferOutput<typeof GetDocumentsResponseSchema>;
export type UploadDocumentsResponse = v.InferOutput<typeof UploadDocumentsResponseSchema>;
export type SubmitOnboardingResponse = v.InferOutput<typeof SubmitOnboardingResponseSchema>;
