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
}

export interface BusinessDetails {
	companyName: string;
	companyType: string;
	cin: string;
	address: Address;
	currentAddress: Address;
	currentAddressSameAsContact: boolean;
	phone: string;
	email: string;
	website: string;
	brandName: string;
}

export interface BankDetails {
	accountHolderName: string;
	accountNumber: string;
	confirmAccountNumber: string;
	ifscCode: string;
	bankName: string;
	branchName: string;
}

export type DirectorStatus = 'verified' | 'pending';

export interface Director {
	name: string;
	pan: string;
	din?: string;
	email?: string;
	phone?: string;
	status: DirectorStatus;
}

export interface DocumentSlot {
	uploaded: boolean;
	required: boolean;
	file?: File | null;
	fileName?: string;
}

export interface Documents {
	gstCertificate: DocumentSlot;
	panCardCopy: DocumentSlot;
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
