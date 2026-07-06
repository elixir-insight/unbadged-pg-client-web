export type OrganizationData = {
	orgId: string | number;
	legalCompanyName: string;
	createdAt: string;
	businessType: string;
	profileType: string;
	profileStatus: string;
};

export interface OrgDataV2 {
	legalCompanyName: string;
	businessType: string;
	profileStatus: string;
	profileType: string;
	affiliateId: number;
	userEmail: string;
	phoneNumber: string;
	bankAccounts: BankDetailsV2[];
	kyb: KYBDetailsV2;
	addressDetails: AddressV2;
	directors: Directors[];
	integration: IntegrationV2;
	documents: Document[];
	createdBy: number;
	updatedBy: number;
}

export type BankDetailsV2 = {
	id?: number;
	holderName: string;
	accountNumber: string;
	ifscCode: string;
	bankName: string;
	branchName: string;
	accountType?: string;
	status?: string;
	confirmAccountNumber?: string;
};

export type KYBDetailsV2 = {
	businessPan: string | undefined;
	gstNumber: string | undefined;
	cin: string | undefined;
	tan: string | undefined;
	businessPhone: string | undefined;
	organizationWebsite: string | undefined;
	industry: string | undefined;
	registeredYear: number | null;
	communicationAddress: string | undefined;
};

export type AddressV2 = {
	address: string | undefined;
	city: string | undefined;
	state: string | undefined;
	country: string | undefined;
	pinCode: string | undefined;
};

export type Directors = {
	id?: number | undefined;
	name: string | undefined;
	aadhar: string | undefined;
	pan: string | undefined;
	email: string | undefined;
	phoneNumber: string | undefined;
};

export type IntegrationV2 = {
	id?: number | null;
	callbackUrl?: string;
	ipAddress: string;
};

export interface Document {
	id: string;
	fileName: string;
	fileType: string;
	size: number;
	createdAt: string;
	updatedAt: string;
	createdBy: number;
	updatedBy: number;
}

export interface OnboardingOrgRecord extends OrgDataV2 {
	orgId: string | number;
	createdAt: string;
}
