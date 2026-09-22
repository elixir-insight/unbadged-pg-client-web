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

export function requiresIncorporationCertificate(entityType: EntityType | null): boolean {
	return entityType === 'partnership' || entityType === 'llp' || entityType === 'private_limited';
}

export function parseEntityType(value: unknown): EntityType | null {
	if (value === 'company') return 'private_limited';
	if (
		value === 'proprietorship' ||
		value === 'partnership' ||
		value === 'llp' ||
		value === 'private_limited'
	) {
		return value;
	}
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
}

export interface DocumentSlot {
	uploaded: boolean;
	required: boolean;
	file?: File | null;
	fileName?: string;
}

export interface Documents {
	gstCertificate: DocumentSlot;
	certificateOfIncorporation: DocumentSlot;
	shopActLicence: DocumentSlot;
	bankStatement: DocumentSlot;
	addressProof: DocumentSlot;
}

export type DocumentKey = keyof Documents;

export interface OnboardingFormData {
	businessPan: string;
	entityType: EntityType | null;
	entityName: string;
	gstin: string;
	gstinList: GstinItem[];
	businessDetails: BusinessDetails;
	bankDetails: BankDetails;
	directors: Director[];
	documents: Documents;
}
