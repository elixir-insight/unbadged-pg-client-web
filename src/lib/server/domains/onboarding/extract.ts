import type { BankDetails, Director, OnboardingPrefill } from '$lib/types/onboarding';
import { normalizeIndianMobilePhone } from '$lib/validation/organization-kyb';
import type {
	BankAccountRecord,
	DocumentRecord,
	GetOrganizationRecord,
	OrganizationDirectorRecord
} from './schema';

// Callers pick the one field they need back out of a validated response envelope's `.data`,
// rather than trusting every field on it — the schemas in schema.ts are already permissive (most
// fields optional) since the real backend shape has never been confirmed live, so these stay
// defensive about `data` itself being absent/null/differently-shaped on top of that. Inputs are
// deliberately `unknown` rather than one exact schema's inferred type: several call sites hand a
// value that could come from either of two sibling endpoints (e.g. the bank create/update loop,
// or the directors GET fallback), so narrowing happens here at runtime, not at the type boundary.

export function extractAccountId(data: unknown): number | undefined {
	const first = Array.isArray(data) ? data[0] : undefined;
	const id =
		first && typeof first === 'object' ? (first as { accountId?: unknown }).accountId : undefined;
	if (typeof id === 'number') return id;
	if (typeof id === 'string' && id.trim() !== '') {
		const parsed = Number(id);
		return Number.isFinite(parsed) ? parsed : undefined;
	}
	return undefined;
}

export function extractApplicationId(data: unknown): string {
	return typeof data === 'string' ? data : '';
}

/** The single org record off a GET .../organization response — always `data[0]`, never the array. */
export function extractOrganizationRecord(data: unknown): GetOrganizationRecord | undefined {
	return Array.isArray(data) ? (data[0] as GetOrganizationRecord | undefined) : undefined;
}

/**
 * The array under `.data` from either an organization GET or PUT response, for
 * extractDirectorIds — both endpoints wrap their differently-shaped org record the same way.
 */
export function extractOrganizationDataArray(data: unknown): unknown[] | undefined {
	return Array.isArray(data) ? data : undefined;
}

export function extractProfileStatus(data: unknown): string {
	return extractOrganizationRecord(data)?.profileStatus ?? '';
}

export function extractVerifications(data: unknown): Record<string, string> {
	const verifications = extractOrganizationRecord(data)?.verifications ?? {};
	// A null/blank remark is no remark.
	return Object.fromEntries(
		Object.entries(verifications).filter(
			(entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim() !== ''
		)
	);
}

function toRegisteredYear(value: number | string | null | undefined): number | null {
	if (typeof value === 'number') return value;
	if (typeof value === 'string' && /^\d{4}$/.test(value.trim())) return Number(value.trim());
	return null;
}

/** The business type captured at signup, off a GET .../organization response. */
export function extractBusinessType(data: unknown): string {
	return extractOrganizationRecord(data)?.businessType ?? '';
}

function toDirectorId(
	id: OrganizationDirectorRecord['id'] | OrganizationDirectorRecord['directorId']
): number | undefined {
	if (typeof id === 'number') return id;
	if (typeof id === 'string' && /^\d+$/.test(id.trim())) return Number(id.trim());
	return undefined;
}

function toPrefillDirector(record: OrganizationDirectorRecord): Director {
	const id = toDirectorId(record.id ?? record.directorId);
	return {
		name: record.name ?? '',
		pan: record.pan ?? '',
		aadhaar: record.aadhar ?? '',
		email: record.email ?? '',
		phone: normalizeIndianMobilePhone(record.phoneNumber ?? record.phone ?? ''),
		...(id !== undefined && { id })
	};
}

/**
 * Everything the applicant already saved, off a GET .../organization response, in the wizard's
 * own form shape — so a resumed session (new browser, cleared storage) shows the saved details
 * instead of an empty form. The street address was saved as `line1, line2` joined (see
 * toKybPayload's streetAddress), so it comes back whole in line1.
 */
export function extractOnboardingPrefill(data: unknown): OnboardingPrefill | null {
	const org = extractOrganizationRecord(data);
	if (!org) return null;
	return {
		businessPan: org.orgPan ?? '',
		gstin: org.gstNumber ?? '',
		businessDetails: {
			cin: org.cin ?? '',
			tan: org.orgTan ?? '',
			brandName: org.brandName ?? '',
			phone: normalizeIndianMobilePhone(org.businessPhone ?? ''),
			website: org.organizationWebsite ?? '',
			industry: org.industry ?? '',
			registeredYear: toRegisteredYear(org.registeredYear),
			communicationAddress: org.communicationAddress ?? '',
			address: {
				line1: org.address?.address ?? '',
				line2: org.address?.address2 ?? '',
				city: org.address?.city ?? '',
				state: org.address?.state ?? '',
				pincode: org.address?.pinCode ?? '',
				...(org.address?.country && { country: org.address.country })
			}
		},
		directors: (org.directors ?? []).map(toPrefillDirector)
	};
}

export function extractBankAccounts(data: unknown): BankAccountRecord[] {
	return Array.isArray(data) ? (data as BankAccountRecord[]) : [];
}

function toAccountId(id: number | string | null | undefined): number | undefined {
	if (typeof id === 'number') return id;
	if (typeof id === 'string' && /^\d+$/.test(id.trim())) return Number(id.trim());
	return undefined;
}

/**
 * Saved bank accounts, off a GET .../bank-accounts response, in the wizard's form shape. The
 * create endpoint returns `accountId`, so that's accepted alongside `id`.
 */
export function extractBankDetails(data: unknown): BankDetails[] {
	return extractBankAccounts(data).map((account) => ({
		accountId: toAccountId(account.id ?? account.accountId),
		accountHolderName: account.holderName ?? '',
		accountNumber: account.accountNumber ?? '',
		confirmAccountNumber: account.accountNumber ?? '',
		ifscCode: account.ifscCode ?? '',
		bankName: account.bankName ?? '',
		branchName: account.branchName ?? '',
		accountType: account.accountType ?? ''
	}));
}

/** Backend field names of the org documents already uploaded (see document-field-names.ts). */
export function extractUploadedFieldNames(data: unknown): string[] {
	return extractDocuments(data)
		.map((doc) => doc.fileName)
		.filter((name): name is string => typeof name === 'string' && name !== '');
}

export function extractDocuments(data: unknown): DocumentRecord[] {
	return Array.isArray(data) ? (data as DocumentRecord[]) : [];
}

const REQUIRED_ORGANIZATION_FIELDS: [
	label: string,
	read: (org: GetOrganizationRecord) => unknown
][] = [
	['Business PAN', (org) => org.orgPan],
	['Brand name', (org) => org.brandName],
	['GSTIN', (org) => org.gstNumber],
	['Business phone', (org) => org.businessPhone ?? org.phoneNumber],
	['Website', (org) => org.organizationWebsite],
	['Industry', (org) => org.industry],
	['Registered year', (org) => org.registeredYear],
	['Communication address', (org) => org.communicationAddress],
	['Address', (org) => org.address?.address],
	['City', (org) => org.address?.city],
	['State', (org) => org.address?.state],
	['Pincode', (org) => org.address?.pinCode],
	['Directors', (org) => (org.directors?.length ? org.directors : undefined)]
];

function isBlank(value: unknown): boolean {
	if (value === undefined || value === null) return true;
	if (typeof value === 'string') return value.trim() === '' || value.trim() === '-';
	if (typeof value === 'number') return value === 0;
	return false;
}

/**
 * Required fields that are still empty on the saved org record — the submit endpoint only says
 * "Complete all required organization fields", so this names which ones, for the error shown.
 */
export function missingOrganizationFields(data: unknown): string[] {
	const org = extractOrganizationRecord(data);
	if (!org) return [];
	return REQUIRED_ORGANIZATION_FIELDS.filter(([, read]) => isBlank(read(org))).map(
		([label]) => label
	);
}
