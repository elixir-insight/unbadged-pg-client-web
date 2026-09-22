import type {
	BusinessDetails,
	Director,
	BankDetails,
	DocumentKey,
	OnboardingFormData
} from '$lib/types/onboarding';

// Browser calls go to the same-origin SvelteKit proxy (src/routes/api/onboarding),
// which attaches the bearer + gateway tokens from the session cookies server-side
// and forwards to the upstream /api/v1/onboarding/* endpoints.
const PROXY_BASE = '/api/onboarding';
const TIMEOUT_MS = 15_000;

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
	const res = await fetch(`${PROXY_BASE}${path}`, {
		method,
		headers: body ? { 'Content-Type': 'application/json' } : undefined,
		body: body ? JSON.stringify(body) : undefined,
		signal: AbortSignal.timeout(TIMEOUT_MS)
	});
	if (!res.ok) {
		const error = (await res.json().catch(() => null)) as { message?: string } | null;
		throw new Error(error?.message || `HTTP ${res.status}`);
	}
	return res.json() as Promise<T>;
}

async function requestMultipart<T>(path: string, formData: FormData): Promise<T> {
	// No Content-Type header — the browser sets the multipart boundary itself for a FormData body.
	const res = await fetch(`${PROXY_BASE}${path}`, {
		method: 'POST',
		body: formData,
		signal: AbortSignal.timeout(TIMEOUT_MS)
	});
	if (!res.ok) {
		const error = (await res.json().catch(() => null)) as { message?: string } | null;
		throw new Error(error?.message || `HTTP ${res.status}`);
	}
	return res.json() as Promise<T>;
}

// ── Steps 1+2: save org (kyb + address + brand), fired at end of step 2 ──────
function toDirectorPayload(d: Director) {
	return {
		...(d.id !== undefined && { id: d.id }),
		name: d.name,
		aadhar: d.aadhaar,
		pan: d.pan,
		email: d.email,
		phoneNumber: d.phone
	};
}

function streetAddress(address: BusinessDetails['address']): string {
	return [address.line1, address.line2]
		.map((part) => part.trim())
		.filter(Boolean)
		.join(', ');
}

export function toKybPayload(fd: OnboardingFormData) {
	return {
		kyb: {
			businessPan: fd.businessPan,
			gstNumber: fd.gstin,
			cin: fd.businessDetails.cin,
			tan: fd.businessDetails.tan,
			businessPhone: fd.businessDetails.phone,
			organizationWebsite: fd.businessDetails.website,
			industry: fd.businessDetails.industry,
			communicationAddress: fd.businessDetails.communicationAddress,
			registeredYear: fd.businessDetails.registeredYear
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

export async function saveOrganization(fd: OnboardingFormData) {
	return request<{ data: unknown[]; message: string; statusCode: number }>(
		'/organization',
		'PUT',
		toKybPayload(fd)
	);
}

export async function fetchOrganization() {
	return request<{ data: unknown[]; message: string; statusCode: number }>('/organization', 'GET');
}

// ── Step 3: bank details ──────────────────────────────────────────────────
export function toBankPayload(b: BankDetails) {
	return {
		accountNumber: b.accountNumber,
		accountType: b.accountType,
		bankName: b.bankName,
		branchName: b.branchName,
		holderName: b.accountHolderName,
		ifscCode: b.ifscCode
	};
}

export async function createBankAccount(b: BankDetails) {
	return request<{ data: { accountId: number; status: string }[] }>(
		'/organization/bank',
		'POST',
		toBankPayload(b)
	);
}

export async function updateBankAccount(accountId: number, b: BankDetails) {
	return request<{ data: unknown[] }>(`/organization/bank/${accountId}`, 'PUT', toBankPayload(b));
}

export async function listBankAccounts() {
	return request<{ data: { id: number; accountNumber: string; status: string }[] }>(
		'/organization/bank-accounts',
		'GET'
	);
}

// ── Step 4: directors (saved via org PUT above) + director documents ───────
export async function saveDirectors(fd: OnboardingFormData) {
	return saveOrganization(fd); // directors[] included in the same payload
}

export async function listDirectorDocuments(directorId: number) {
	return request<{ data: { id: number; fileName: string; preSignedUrl: string }[] }>(
		`/organization/directors/${directorId}/documents`,
		'GET'
	);
}

// TODO(api): request body shape (multipart vs presigned-URL) and the document-type
// field are unconfirmed — do not call this until both are provided.
export async function uploadDirectorDocument(directorId: number, file: File): Promise<never> {
	void directorId;
	void file;
	throw new Error('uploadDirectorDocument: awaiting API request-body confirmation');
}

// ── Step 5: org-level documents ─────────────────────────────────────────────
export async function listOrgDocuments() {
	return request<{ data: { id: number; fileName: string; preSignedUrl: string }[] }>(
		'/organization/documents',
		'GET'
	);
}

// Multipart field names the upload endpoint expects per document type, in the backend's own
// camelCase vocabulary confirmed by lib/server/domains/organization/utils/document-field-names.ts
// (used to parse real GET .../documents responses, not guessed). shopActLicence has no known
// equivalent there at all, and addressProof isn't a real field either — the backend's address
// proof is one of two specific documents (rentalAgreement / electricityBill), and picking between
// them isn't something to infer silently. Both stay unsupported until confirmed, rather than
// risk another rejected upload (or worse, one the backend silently misfiles) — see
// isOrgDocumentUploadSupported.
const ORG_DOCUMENT_FIELD_NAMES: Partial<Record<DocumentKey, string>> = {
	gstCertificate: 'gstCertificate',
	certificateOfIncorporation: 'incorpCertificate',
	bankStatement: 'bankStatement'
};

export function isOrgDocumentUploadSupported(documentType: DocumentKey): boolean {
	return documentType in ORG_DOCUMENT_FIELD_NAMES;
}

export async function uploadOrgDocument(documentType: DocumentKey, file: File) {
	const fieldName = ORG_DOCUMENT_FIELD_NAMES[documentType];
	if (!fieldName) {
		throw new Error(`uploadOrgDocument: no confirmed backend field for "${documentType}" yet`);
	}
	const formData = new FormData();
	formData.append(fieldName, file, file.name);
	return requestMultipart<{ data: unknown[]; message: string; statusCode: number }>(
		'/organization/documents',
		formData
	);
}

// ── Step 6: submit ───────────────────────────────────────────────────────
export async function submitOnboarding() {
	const res = await request<{ data: string; message: string; statusCode: number }>(
		'/organization/submit',
		'POST'
	);
	return { success: true as const, applicationId: res.data };
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
