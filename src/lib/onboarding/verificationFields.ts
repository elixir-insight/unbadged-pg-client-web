/**
 * Field names used by the onboarding verification API
 * (GET/PATCH /api/v1/management/onboard/organization/{orgId}/verifications).
 *
 * These differ from the organization details keys (e.g. details `gstNumber` is verified as
 * `kyb.gstNumber`, `directors[0].pan` as `directors.{directorId}.pan`), so every verification
 * read or write must go through this module.
 */

export const VERIFICATION_STATUSES = ['VERIFIED', 'PENDING', 'REJECTED'] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** One item from GET /verifications `data`. */
export type FieldVerification = {
	fieldName: string;
	status: VerificationStatus;
	remarks?: string | null;
};

/** PATCH /verifications body. Empty arrays are omitted. */
export type ReviewPayload = {
	verified?: string[];
	rejected?: { fieldName: string; remarks: string }[];
	resetToPending?: string[];
};

/** Organization details key → verification fieldName, for the org-level fields that are tracked. */
export const ORGANIZATION_FIELD_MAP = {
	brandName: 'brandName',
	gstNumber: 'kyb.gstNumber',
	orgTan: 'kyb.tan',
	orgPan: 'kyb.businessPan',
	cin: 'kyb.cin',
	businessPhone: 'kyb.businessPhone',
	industry: 'kyb.industry',
	organizationWebsite: 'kyb.organizationWebsite',
	communicationAddress: 'kyb.communicationAddress',
	registeredYear: 'kyb.registeredYear'
} as const;

/** Registered address keys that can be tracked; `address2` (line 2) is tracked for some orgs. */
export const ADDRESS_FIELDS = [
	'address',
	'address2',
	'city',
	'state',
	'country',
	'pinCode'
] as const;
export type AddressField = (typeof ADDRESS_FIELDS)[number];

export const DIRECTOR_FIELDS = ['name', 'pan', 'aadhar', 'email', 'phoneNumber'] as const;
export type DirectorField = (typeof DIRECTOR_FIELDS)[number];

export const DIRECTOR_DOCUMENTS = ['pan', 'aadhar'] as const;
export type DirectorDocument = (typeof DIRECTOR_DOCUMENTS)[number];

export const BANK_FIELDS = [
	'accountNumber',
	'accountType',
	'bankName',
	'branchName',
	'holderName',
	'ifscCode'
] as const;
export type BankField = (typeof BANK_FIELDS)[number];

export const ORGANIZATION_DOCUMENTS = [
	'aoa',
	'moa',
	'brDocument',
	'businessPan',
	'businessTan',
	'electricityBill',
	'gstCertificate',
	'incorpCertificate',
	'uboDeclaration',
	'voidedCheque'
] as const;
export type OrganizationDocumentName = (typeof ORGANIZATION_DOCUMENTS)[number];

/** Keyed by director.id (e.g. 100107), never the array index. */
export function directorField(directorId: string, field: DirectorField): string {
	return `directors.${directorId}.${field}`;
}

export function directorDoc(directorId: string, doc: DirectorDocument): string {
	return `directors.${directorId}.documents.${doc}`;
}

export function bankField(accountId: string, field: BankField): string {
	return `bankAccounts.${accountId}.${field}`;
}

export function docField(name: OrganizationDocumentName): string {
	return `documents.${name}`;
}

export function addressField(key: AddressField): string {
	return `addressDetails.${key}`;
}
