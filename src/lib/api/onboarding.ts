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
import {
	effectiveRegisteredAddress,
	joinAddress,
	trimAddress
} from '$lib/utils/onboarding-address';

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
		/** The communication address joined into one string (see joinAddress). */
		communicationAddress: string;
		registeredYear: number;
	};
	addressDetails: {
		address: string;
		address2: string;
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

/**
 * The form fields PUT /organization carries — satisfied by the live form and by the
 * server-prefill (OnboardingPrefill), so the saved baseline can be shaped exactly like a save.
 */
export type KybSource = Pick<OnboardingFormData, 'businessPan' | 'gstin' | 'directors'> & {
	businessDetails: Omit<BusinessDetails, 'companyType'>;
};

export function toKybPayload(fd: KybSource): UpdateOrganizationRequest {
	const registered = trimAddress(effectiveRegisteredAddress(fd.businessDetails));
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
			communicationAddress: joinAddress(fd.businessDetails.communicationAddress),
			// Always non-null in practice: step navigation locks step 2+ until business-identity
			// (which collects it) is complete — see firstIncompleteStep in +layout.svelte.
			registeredYear: fd.businessDetails.registeredYear ?? 0
		},
		addressDetails: {
			address: registered.line1,
			address2: registered.line2,
			city: registered.city,
			state: registered.state,
			// Not collected in the wizard.
			country: registered.country ?? 'India',
			pinCode: registered.pincode
		},
		brandName: fd.businessDetails.brandName,
		directors: fd.directors.map(toDirectorPayload)
	};
}

// ── Per-step saves of PUT /organization ──────────────────────────────────
/**
 * The wizard steps that save through PUT /organization, each owning part of the payload:
 * identity (step 1) = brandName + every kyb field but the communication address, address
 * (step 2) = kyb.communicationAddress + addressDetails, directors (step 4) = directors.
 */
export type OrganizationSection = 'identity' | 'address' | 'directors';

type KybPayload = UpdateOrganizationRequest['kyb'];

/**
 * Stand-in older identity saves sent for an address not saved yet. The backend now rejects it
 * ("Invalid City"), so it is no longer sent (see dropUnsavedAddress) — only read back as empty by
 * extractOnboardingPrefill, for orgs that still have it stored.
 */
export const ADDRESS_PLACEHOLDER = '-';

/**
 * A step save's body without an address that hasn't been saved yet: an identity or directors save
 * before step 2 would otherwise send a blank (or placeholder) address, which the backend rejects.
 * The address step always sends its own, so it never loses anything here.
 */
export function dropUnsavedAddress(payload: UpdateOrganizationRequest): RemarkedUpdateRequest {
	const next: RemarkedUpdateRequest = { ...payload, kyb: { ...payload.kyb } };
	if (!payload.kyb.communicationAddress.trim()) delete next.kyb?.communicationAddress;
	const address = payload.addressDetails;
	const addressEmpty = [
		address.address,
		address.address2,
		address.city,
		address.state,
		address.pinCode
	].every((value) => !value?.trim());
	if (addressEmpty) delete next.addressDetails;
	return next;
}

function identityKyb(kyb: KybPayload): Omit<KybPayload, 'communicationAddress'> {
	const next: Partial<KybPayload> = { ...kyb };
	delete next.communicationAddress;
	return next as Omit<KybPayload, 'communicationAddress'>;
}

function withoutPan(kyb: KybPayload): KybPayload {
	const next = { ...kyb };
	delete next.businessPan;
	return next;
}

/** The part of a payload one section owns — what Continue compares to skip unchanged saves. */
export function toSectionSnapshot(
	section: OrganizationSection,
	payload: UpdateOrganizationRequest
) {
	switch (section) {
		case 'identity':
			return { brandName: payload.brandName, kyb: identityKyb(payload.kyb) };
		case 'address':
			return {
				communicationAddress: payload.kyb.communicationAddress,
				addressDetails: payload.addressDetails
			};
		case 'directors':
			return { directors: payload.directors };
	}
}

/**
 * The full PUT /organization body for one step's save: everything as last saved upstream
 * (`saved`, from a fresh GET), with only `section`'s fields taken from the form. Always the whole
 * object, so it's correct whether the backend merges or replaces — and other steps' unsaved
 * local edits are never sent along. businessPan is only sent when typed anew (see toKybPayload):
 * never the masked value, and never on a non-identity save.
 */
export function toSectionPayload(
	section: OrganizationSection,
	form: KybSource,
	saved: KybSource
): UpdateOrganizationRequest {
	const base = toKybPayload(saved);
	const own = toKybPayload(form);
	// Only a PAN the user typed on step 1 is ever sent — the saved one comes back masked.
	const savedKyb = withoutPan(base.kyb);
	switch (section) {
		case 'identity':
			return {
				...base,
				brandName: own.brandName,
				kyb: { ...identityKyb(own.kyb), communicationAddress: base.kyb.communicationAddress }
			};
		case 'address':
			return {
				...base,
				kyb: { ...savedKyb, communicationAddress: own.kyb.communicationAddress },
				addressDetails: own.addressDetails
			};
		case 'directors':
			return { ...base, kyb: savedKyb, directors: own.directors };
	}
}

// ── Remarked saves ────────────────────────────────────────────────────────
/**
 * A PUT /organization body carrying only some fields. While an org is REMARKED the backend
 * rejects any field management didn't reject ("Only rejected fields can be updated while the
 * organization is remarked"), even unchanged ones.
 */
export type RemarkedUpdateRequest = {
	brandName?: string;
	kyb?: Partial<KybPayload>;
	addressDetails?: Partial<UpdateOrganizationRequest['addressDetails']>;
	directors?: Partial<UpdateOrganizationDirectorPayload>[];
};

const DIRECTOR_BY_ID = /^directors\.(\d+)\.([A-Za-z]+)$/;
const DIRECTOR_BY_INDEX = /^directors\[(\d+)\]\.([A-Za-z]+)$/;
const DIRECTOR_PAYLOAD_FIELDS: Record<string, keyof UpdateOrganizationDirectorPayload> = {
	name: 'name',
	email: 'email',
	pan: 'pan',
	aadhar: 'aadhar',
	phoneNumber: 'phoneNumber',
	phone: 'phoneNumber'
};

/**
 * Narrows a full save payload to the fields named by `rejectedKeys` (the remark keys off GET
 * /organization `verifications`). Keys the payload doesn't carry — documents, bank fields, a
 * masked PAN — are skipped, so the result can be empty: then there is nothing to save.
 */
export function pickRejectedFields(
	payload: UpdateOrganizationRequest,
	rejectedKeys: readonly string[]
): RemarkedUpdateRequest {
	const picked: RemarkedUpdateRequest = {};
	const kyb: Partial<KybPayload> = {};
	const address: Partial<UpdateOrganizationRequest['addressDetails']> = {};
	const directorPatches = new Map<number, Partial<UpdateOrganizationDirectorPayload>>();

	function patchDirector(index: number, field: string) {
		const director = payload.directors[index];
		const key = DIRECTOR_PAYLOAD_FIELDS[field];
		if (!director || !key || director[key] === undefined) return;
		const patch = directorPatches.get(index) ?? {
			...(director.id !== undefined && { id: director.id })
		};
		directorPatches.set(index, { ...patch, [key]: director[key] });
	}

	for (const rawKey of rejectedKeys) {
		const key = rawKey.trim();
		if (key === 'brandName') {
			picked.brandName = payload.brandName;
		} else if (key.startsWith('kyb.communicationAddress')) {
			kyb.communicationAddress = payload.kyb.communicationAddress;
		} else if (key.startsWith('kyb.')) {
			const field = key.slice('kyb.'.length) as keyof KybPayload;
			if (payload.kyb[field] !== undefined) Object.assign(kyb, { [field]: payload.kyb[field] });
		} else if (key.startsWith('addressDetails.')) {
			const field = key.slice('addressDetails.'.length) as keyof typeof address;
			if (field in payload.addressDetails) address[field] = payload.addressDetails[field];
		} else {
			const byId = DIRECTOR_BY_ID.exec(key);
			if (byId) {
				const index = payload.directors.findIndex((d) => String(d.id) === byId[1]);
				if (index >= 0) patchDirector(index, byId[2]);
				continue;
			}
			const byIndex = DIRECTOR_BY_INDEX.exec(key);
			if (byIndex) patchDirector(Number(byIndex[1]), byIndex[2]);
		}
	}

	if (Object.keys(kyb).length > 0) picked.kyb = kyb;
	if (Object.keys(address).length > 0) picked.addressDetails = address;
	if (directorPatches.size > 0) {
		picked.directors = [...directorPatches.entries()]
			.sort(([a], [b]) => a - b)
			.map(([, patch]) => patch);
	}
	return picked;
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
