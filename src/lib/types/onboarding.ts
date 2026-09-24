export type EntityType = 'proprietorship' | 'partnership' | 'llp' | 'private_limited';
export type OnboardingMode = 'auto' | 'manual';

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
	proprietorship: 'Proprietorship',
	partnership: 'Partnership',
	llp: 'LLP',
	private_limited: 'Private Limited'
};

export const ENTITY_TYPE_COMPANY_TYPES: Record<EntityType, string> = {
	proprietorship: 'Sole Proprietorship',
	partnership: 'Partnership',
	llp: 'LLP',
	private_limited: 'Private Limited'
};

/** Business TAN, AOA and MOA — only asked of private limited companies, same as management onboarding. */
export function requiresCompanyDocuments(entityType: EntityType | null): boolean {
	return entityType === 'private_limited';
}

/**
 * Accepts our own internal tokens (from persisted state) as well as the signup/backend business
 * type enum (e.g. SOLE_PROPRIETORSHIP, LIMITED_LIABILITY_PARTNERSHIP — see SIGN_UP_BUSINESS_TYPE_VALUES),
 * case- and separator-insensitive, so hydrating entityType from either source works the same way.
 */
export function parseEntityType(value: unknown): EntityType | null {
	if (typeof value !== 'string') return null;
	const normalized = value
		.trim()
		.toUpperCase()
		.replace(/[\s-]+/g, '_');
	if (normalized === 'COMPANY') return 'private_limited';
	if (normalized === 'PROPRIETORSHIP' || normalized === 'SOLE_PROPRIETORSHIP') {
		return 'proprietorship';
	}
	if (normalized === 'PARTNERSHIP') return 'partnership';
	if (normalized === 'LLP' || normalized === 'LIMITED_LIABILITY_PARTNERSHIP') return 'llp';
	if (normalized === 'PRIVATE_LIMITED') return 'private_limited';
	return null;
}

export interface GstinItem {
	gstin: string;
	status: 'Active' | 'Inactive' | string;
	tradeName?: string;
	registrationType?: string;
}

export interface Address {
	line1: string;
	line2: string;
	city: string;
	state: string;
	pincode: string;
	/** Defaults to India when omitted (see toKybPayload). */
	country?: string;
}

export interface BusinessDetails {
	companyType: string;
	cin: string;
	address: Address;
	phone: string;
	website: string;
	brandName: string;
	tan: string;
	industry: string;
	registeredYear: number | null;
	communicationAddress: string;
}

export interface BankDetails {
	accountHolderName: string;
	accountNumber: string;
	confirmAccountNumber: string;
	ifscCode: string;
	bankName: string;
	branchName: string;
	accountType: string;
	/** Set once the bank account exists upstream; never rendered. */
	accountId?: number;
}

export interface Director {
	name: string;
	pan: string;
	aadhaar: string;
	email: string;
	phone: string;
	/** Set once the director exists upstream; never rendered. */
	id?: number;
	/** Name of the uploaded Aadhaar card document ('Uploaded' when only known from the server). */
	aadhaarDocument?: string;
	/** Name of the uploaded PAN card document ('Uploaded' when only known from the server). */
	panDocument?: string;
}

export interface DocumentSlot {
	uploaded: boolean;
	required: boolean;
	file?: File | null;
	fileName?: string;
}

/**
 * Mirrors management onboarding's document set (fixedRequiredDocuments, documentChoiceGroups and
 * privateLimitedExtraDocuments in lib/data/mockData.ts). businessCertificate, proofOfFunds and
 * addressProof are "pick one of" slots — see ORG_DOCUMENT_FIELDS in api/onboarding.ts.
 */
export interface Documents {
	gstCertificate: DocumentSlot;
	businessPanCard: DocumentSlot;
	uboDeclaration: DocumentSlot;
	boardResolution: DocumentSlot;
	businessCertificate: DocumentSlot;
	proofOfFunds: DocumentSlot;
	addressProof: DocumentSlot;
	businessTan: DocumentSlot;
	aoa: DocumentSlot;
	moa: DocumentSlot;
}

export type DocumentKey = keyof Documents;

export const DOCUMENT_KEYS: DocumentKey[] = [
	'gstCertificate',
	'businessPanCard',
	'uboDeclaration',
	'boardResolution',
	'businessCertificate',
	'proofOfFunds',
	'addressProof',
	'businessTan',
	'aoa',
	'moa'
];

const COMPANY_DOCUMENT_KEYS = new Set<DocumentKey>(['businessTan', 'aoa', 'moa']);

/** Every slot is required, except the company-only ones for other entity types. */
export function isDocumentRequired(key: DocumentKey, entityType: EntityType | null): boolean {
	return !COMPANY_DOCUMENT_KEYS.has(key) || requiresCompanyDocuments(entityType);
}

export interface OnboardingFormData {
	businessPan: string;
	entityType: EntityType | null;
	entityName: string;
	gstin: string;
	gstinList: GstinItem[];
	businessDetails: BusinessDetails;
	bankAccounts: BankDetails[];
	directors: Director[];
	documents: Documents;
}
