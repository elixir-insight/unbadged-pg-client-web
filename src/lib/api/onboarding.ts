import type {
	BusinessDetails,
	Director,
	BankDetails,
	DocumentKey,
	OnboardingFormData
} from '$lib/types/onboarding';
import {
	isMaskedAadhar,
	isMaskedPan,
	normalizeIndianMobilePhone,
	toE164IndianPhone
} from '$lib/validation/organization-kyb';

// Request payload shapes, defined here (not in lib/server/domains/onboarding/schema.ts) because
// this module is shared with client-side code (documents/+page.svelte, review-submit/+page.svelte
// import from it) — anything under $lib/server/ can't be imported into client bundles. The server
// client.ts imports these same types for its function signatures instead of redeclaring them.

export interface UpdateOrganizationDirectorPayload {
	id?: number;
	name: string;
	/** Omitted when masked — the backend already holds it (see isMaskedAadhar). */
	aadhar?: string;
	/** Omitted when masked — the backend already holds it (see isMaskedPan). */
	pan?: string;
	email: string;
	phoneNumber: string;
}

export interface UpdateOrganizationRequest {
	kyb: {
		/** Omitted when masked — the backend already holds it (see isMaskedPan). */
		businessPan?: string;
		gstNumber: string;
		cin: string;
		tan: string;
		businessPhone: string;
		organizationWebsite: string;
		industry: string;
		communicationAddress: string;
		registeredYear: number;
	};
	addressDetails: {
		address: string;
		city: string;
		state: string;
		country: string;
		pinCode: string;
	};
	brandName: string;
	directors: UpdateOrganizationDirectorPayload[];
}

export interface BankAccountRequest {
	accountNumber: string;
	accountType: string;
	bankName: string;
	branchName: string;
	holderName: string;
	ifscCode: string;
}

// This module holds only pure, network-free logic shared by the client and the server: payload
// shaping and the org-document field-name vocabulary. Every real network call now lives in each
// step's +page.server.ts form action (see lib/server/domains/onboarding/), so the backend URL and
// auth tokens never reach the browser.

// ── Steps 1+2: save org (kyb + address + brand), fired at end of step 2 ──────
/** `+91XXXXXXXXXX` from any common typed form (`098…`, `+91 98…`) — the backend requires E.164. */
function toPhonePayload(phone: string): string {
	return toE164IndianPhone(normalizeIndianMobilePhone(phone));
}

function toDirectorPayload(d: Director): UpdateOrganizationDirectorPayload {
	return {
		...(d.id !== undefined && { id: d.id }),
		name: d.name,
		...(!isMaskedAadhar(d.aadhaar) && { aadhar: d.aadhaar }),
		...(!isMaskedPan(d.pan) && { pan: d.pan }),
		email: d.email,
		// The backend rejects anything else: "Phone numbers must contain country code and be in
		// E.164 format". Same formatting as management's update-kyb.ts.
		phoneNumber: toPhonePayload(d.phone)
	};
}

function streetAddress(address: BusinessDetails['address']): string {
	return [address.line1, address.line2]
		.map((part) => part.trim())
		.filter(Boolean)
		.join(', ');
}

/**
 * The form fields PUT /organization carries — satisfied by the live form and by the
 * server-prefill (OnboardingPrefill), so the saved baseline can be shaped exactly like a save.
 */
export type KybSource = Pick<OnboardingFormData, 'businessPan' | 'gstin' | 'directors'> & {
	businessDetails: Omit<BusinessDetails, 'companyType'>;
};

export function toKybPayload(fd: KybSource): UpdateOrganizationRequest {
	return {
		kyb: {
			// GET returns the saved PAN masked; sending it back would overwrite it with asterisks.
			...(!isMaskedPan(fd.businessPan) && { businessPan: fd.businessPan }),
			gstNumber: fd.gstin,
			cin: fd.businessDetails.cin,
			tan: fd.businessDetails.tan,
			businessPhone: toPhonePayload(fd.businessDetails.phone),
			organizationWebsite: fd.businessDetails.website,
			industry: fd.businessDetails.industry,
			communicationAddress: fd.businessDetails.communicationAddress,
			// Always non-null in practice: step navigation locks step 2+ until business-identity
			// (which collects it) is complete — see firstIncompleteStep in +layout.svelte.
			registeredYear: fd.businessDetails.registeredYear ?? 0
		},
		addressDetails: {
			address: streetAddress(fd.businessDetails.address),
			city: fd.businessDetails.address.city,
			state: fd.businessDetails.address.state,
			country: fd.businessDetails.address.country ?? 'India',
			pinCode: fd.businessDetails.address.pincode
		},
		brandName: fd.businessDetails.brandName,
		directors: fd.directors.map(toDirectorPayload)
	};
}

// ── Step 3: bank details ──────────────────────────────────────────────────
export function toBankPayload(b: BankDetails): BankAccountRequest {
	return {
		accountNumber: b.accountNumber,
		accountType: b.accountType,
		bankName: b.bankName,
		branchName: b.branchName,
		holderName: b.accountHolderName,
		ifscCode: b.ifscCode
	};
}

/**
 * Everything the bank save sends, per account — including the id, since an account without one
 * is created rather than updated. Compared against the last saved copy to skip no-op saves.
 */
export function toBankSaveSnapshot(banks: BankDetails[]) {
	return banks.map((bank) => ({ accountId: bank.accountId, ...toBankPayload(bank) }));
}

// ── Step 5: org-level documents ─────────────────────────────────────────────
// Backend multipart field names each document slot may upload under, with the label shown for
// it — the same vocabulary management onboarding uploads with (upload-documents.ts
// backendFieldNameMap / document-field-names.ts), so nothing here is guessed. A slot with more
// than one entry is a "pick one of" choice, exactly like management's documentChoiceGroups.
export const ORG_DOCUMENT_FIELDS: Record<DocumentKey, Record<string, string>> = {
	gstCertificate: { gstCertificate: 'GST certificate' },
	businessPanCard: { businessPan: 'Business PAN card' },
	uboDeclaration: { uboDeclaration: 'UBO declaration' },
	boardResolution: { brDocument: 'Board resolution for authorized signatory' },
	businessCertificate: {
		incorpCertificate: 'Incorporation certificate',
		udyamCertificate: 'Udyam certificate',
		msmeCertificate: 'MSME certificate'
	},
	proofOfFunds: {
		voidedCheque: 'Cancelled cheque',
		bankStatement: 'Bank statement (last 3 months)'
	},
	addressProof: {
		rentalAgreement: 'Rental agreement',
		electricityBill: 'Electricity bill'
	},
	businessTan: { businessTan: 'Business TAN' },
	aoa: { aoa: 'Article of Association (AOA)' },
	moa: { moa: 'Memorandum of Association (MOA)' }
};

/** The backend fields a slot can upload under, as dropdown options (first one is the default). */
export function documentFieldOptions(key: DocumentKey): { value: string; label: string }[] {
	return Object.entries(ORG_DOCUMENT_FIELDS[key]).map(([value, label]) => ({ value, label }));
}

/** Whether `fieldName` is one of the backend fields this slot may upload under. */
export function isDocumentFieldName(key: DocumentKey, fieldName: string): boolean {
	return Object.hasOwn(ORG_DOCUMENT_FIELDS[key], fieldName);
}

/** Which slot a GET .../documents `fileName` (a backend field name) belongs to, for resume. */
export function getDocumentKeyForFieldName(fieldName: string): DocumentKey | undefined {
	return (Object.keys(ORG_DOCUMENT_FIELDS) as DocumentKey[]).find((key) =>
		isDocumentFieldName(key, fieldName)
	);
}

// ── Not yet available — no endpoint provided, keep manual-entry fallback ───
export async function verifyPan(): Promise<{ success: false; mode: 'manual' }> {
	return { success: false, mode: 'manual' }; // TODO(api): PAN verify endpoint not provided
}
export async function fetchGstinList(): Promise<{ success: false; mode: 'manual' }> {
	return { success: false, mode: 'manual' }; // TODO(api): GSTIN-by-PAN endpoint not provided
}
export async function lookupIfsc(): Promise<{ success: false; mode: 'manual' }> {
	return { success: false, mode: 'manual' }; // TODO(api): IFSC lookup endpoint not provided
}
