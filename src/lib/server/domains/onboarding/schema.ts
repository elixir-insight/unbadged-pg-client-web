import * as v from 'valibot';

// Every onboarding endpoint's success envelope is `{ data, message, pagination, statusCode }`.
// `pagination` is never consumed by any caller so it's left untyped/ignored, same as the
// management-onboarding schemas' treatment of fields nobody reads. Response shapes here are kept
// permissive (fields optional, ids aliased across likely casings) rather than a strict contract —
// unlike the outgoing request schemas, which we fully control and can validate tightly — because
// the real backend shape has never been confirmed against a live response (see extract.ts's prior
// v.unknown() usage). A too-strict response schema would reject a whole call over one unexpected
// or missing field; that's the failure mode to avoid until the shapes below are confirmed live.
//
// So every response field is tolerant: `null` is accepted (the backend sends it for unset values),
// and a field of an unexpected type falls back to `undefined` instead of failing the record. One
// odd field (e.g. a date sent as an array, a number where text was expected) used to reject the
// whole GET — valibot reports that as `data: Expected (Array | null) but received Array` — and the
// wizard then showed an empty step as if nothing had been saved.

/** Text from a response: a string, or a number where text was expected (ids, pincodes). */
const text = v.fallback(
	v.nullish(v.pipe(v.union([v.string(), v.number()]), v.transform(String))),
	undefined
);
/** An id the backend has sent both as a number and as a numeric string. */
const id = v.fallback(v.nullish(v.union([v.number(), v.string()])), undefined);
const count = v.fallback(v.nullish(v.number()), undefined);
/** A field nothing reads — accepted in any shape, or missing. */
const ignored = v.optional(v.unknown());

const PaginationSchema = ignored;

// ── 1. GET /organization ────────────────────────────────────────────────

export const OrganizationAddressSchema = v.object({
	address: text,
	address2: text,
	city: text,
	country: text,
	pinCode: text,
	state: text
});

export const OrganizationDirectorRecordSchema = v.object({
	id,
	// Management's mapper (organization/mappers/from-api/directors.ts) reads `id ?? directorId`.
	directorId: id,
	name: text,
	pan: text,
	email: text,
	phoneNumber: text,
	phone: text,
	aadhar: text
});

export const GetOrganizationRecordSchema = v.object({
	orgId: text,
	profileStatus: text,
	profileType: text,
	legalCompanyName: text,
	businessType: text,
	brandName: text,
	orgPan: text,
	gstNumber: text,
	cin: text,
	orgTan: text,
	email: text,
	phoneNumber: text,
	businessPhone: text,
	organizationWebsite: text,
	industry: text,
	communicationAddress: text,
	// Seen as a number; a numeric string is converted in extract.ts.
	registeredYear: id,
	serviceTypes: ignored,
	address: v.fallback(v.nullish(OrganizationAddressSchema), undefined),
	directors: v.fallback(v.nullish(v.array(OrganizationDirectorRecordSchema)), undefined),
	// Values other than a non-blank string are dropped in extractVerifications.
	verifications: v.fallback(v.nullish(v.record(v.string(), v.unknown())), undefined)
});

export const GetOrganizationResponseSchema = v.object({
	message: text,
	statusCode: count,
	pagination: PaginationSchema,
	// Documented as `data: GetOrganizationResponse[]` — always treat as a single org, data[0].
	data: v.nullish(v.array(GetOrganizationRecordSchema))
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

/**
 * Same section shapes echoed back — only the director ids are ever read (see extract.ts), so the
 * rest is accepted in any shape: validating the echo strictly turned a successful save into an
 * "Unexpected response shape" failure whenever it came back with an empty/null address field.
 */
export const UpdateOrganizationResponseSectionSchema = v.object({
	addressDetails: ignored,
	directors: v.fallback(v.nullish(v.array(OrganizationDirectorRecordSchema)), undefined),
	kyb: ignored
});

export const UpdateOrganizationResponseSchema = v.object({
	message: text,
	statusCode: count,
	pagination: PaginationSchema,
	data: v.nullish(v.array(UpdateOrganizationResponseSectionSchema))
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
	accountId: id,
	accountNumber: text,
	accountType: text,
	bankName: text,
	branchName: text,
	holderName: text,
	ifscCode: text,
	status: text
});

export const CreateBankAccountResponseSchema = v.object({
	message: text,
	statusCode: count,
	pagination: PaginationSchema,
	data: v.nullish(v.array(CreatedBankAccountRecordSchema))
});

/** PUT bank response has never echoed a usable body (`data: [{}]` per contract) — id unchanged. */
export const UpdateBankAccountResponseSchema = v.object({
	message: text,
	statusCode: count,
	pagination: PaginationSchema,
	data: ignored
});

// ── 4. GET /organization/bank-accounts ──────────────────────────────────

export const BankAccountRecordSchema = v.object({
	id,
	accountId: id,
	accountNumber: text,
	accountType: text,
	bankName: text,
	branchName: text,
	holderName: text,
	ifscCode: text,
	status: text,
	// Audit fields — never read, and dates may come as arrays (e.g. Java LocalDateTime).
	createdAt: ignored,
	createdBy: ignored,
	updatedAt: ignored,
	updatedBy: ignored
});

export const GetBankAccountsResponseSchema = v.object({
	message: text,
	statusCode: count,
	pagination: PaginationSchema,
	data: v.nullish(v.array(BankAccountRecordSchema))
});

// ── 6. DELETE /organization/directors/{directorId} ──────────────────────

export const DeleteDirectorResponseSchema = v.object({
	message: text,
	statusCode: count,
	pagination: PaginationSchema,
	// Never read — kept loose so an unexpected `data` (null, object) can't turn a successful
	// delete into an "Unexpected response shape" error.
	data: ignored
});

// ── 7 & 9. GET director/org documents ───────────────────────────────────

export const DocumentRecordSchema = v.object({
	id,
	documentId: id,
	fileName: text,
	fileSize: count,
	fileType: text,
	createdAt: ignored,
	preSignedUrl: text
});

export const GetDocumentsResponseSchema = v.object({
	message: text,
	statusCode: count,
	pagination: PaginationSchema,
	data: v.nullish(v.array(DocumentRecordSchema))
});

// ── 8 & 10. POST director/org documents ─────────────────────────────────

export const UploadDocumentRecordSchema = v.object({
	documentId: id,
	fileName: text,
	fileSize: count,
	fileType: text
});

export const UploadDocumentsResponseSchema = v.object({
	message: text,
	statusCode: count,
	pagination: PaginationSchema,
	data: v.nullish(v.array(UploadDocumentRecordSchema))
});

// ── 11. POST /organization/submit ───────────────────────────────────────

export const SubmitOnboardingResponseSchema = v.object({
	message: text,
	statusCode: count,
	pagination: PaginationSchema,
	// The application id.
	data: text
});

// ── Error envelope — documented shape; not yet observed live (see client.ts's apiFetch, which
// currently reads a single `exceptionCode`/`message`, not this array). Kept for reference only;
// nothing parses this yet, since inventing a parser for an unconfirmed shape risks masking the
// real one apiFetch already extracts.
export const OnboardingApiErrorSchema = v.object({
	errors: v.optional(v.array(v.object({ code: v.optional(v.string()) })))
});

// ── Inferred types ───────────────────────────────────────────────────────

export type OrganizationDirectorRecord = v.InferOutput<typeof OrganizationDirectorRecordSchema>;
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
