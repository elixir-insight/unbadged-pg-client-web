// ─── Shared Types ────────────────────────────────────────────────────────────
// Used across +page.svelte and all tab components.

export type TabKey = 'kyb' | 'account' | 'documents' | 'integration' | 'configuration';

export interface TabItem {
	key: TabKey;
	label: string;
}

// ── Domain models ─────────────────────────────────────────────────────────────

export interface OnboardingStep {
	label: string;
	done: boolean;
}

export interface DirectorDetail {
	name: string;
	aadhaar: string;
	pan: string;
	email: string;
	phone: string;
}

export interface KybDetail {
	companyName: string;
	country: string;
	state: string;
	city: string;
	pincode: string;
	companyGstNumber: string;
	cinNumber: string;
	tanNumber: string;
	companyPhoneNumber: string;
	companyUrl: string;
	businessPan: string;
	registeredYear: string;
	industry: string;
	companyLogo?: string | null;
	address: string;
	directors: DirectorDetail[];
}

export interface IntegrationDetail {
	callbackUrl: string;
	ipAddress: string;
}

export interface ContactDetail {
	name: string;
	role: string;
	email: string;
	phone: string;
	timezone: string;
}

export const BANK_ACCOUNT_STATUSES = [
	'ACTIVE',
	'ON_HOLD',
	'IN_ACTIVE',
	'BLOCKED',
	'CLOSED'
] as const;

export type BankAccountStatus = (typeof BANK_ACCOUNT_STATUSES)[number];

export interface BankingDetail {
	id: string;
	accountHolder: string;
	accountNumber: string;
	bank: string;
	branch: string;
	routingIFSC: string;
	status: BankAccountStatus;
	isPrimary?: boolean;
}

export interface OrgDocument {
	name: string;
	type: string;
	uploadedDate: string;
	status: string;
}

export interface OrgDetail {
	email: string;
	phone: string;
	country: string;
	lastUpdated: string;
	kyb: KybDetail;
	contact: ContactDetail;
	banks: BankingDetail[];
	onboarding: OnboardingStep[];
	documents: OrgDocument[];
}

// ── Row helper ────────────────────────────────────────────────────────────────

export interface DetailRow {
	label: string;
	value: string;
}

// ── Virtual Account ───────────────────────────────────────────────────────────

export interface VirtualAccount {
	id: string;
	alias: string;
	accountNumber: string;
	bank: string;
	active: boolean;
}

export interface CommissionTier {
	id: string;
	baseAmount: string;
	method: string;
	gatewayFee: string;
	partnerFee: string;
}

export interface VAFormState {
	bankingPipeline: string;
	transactionTypes: string[];
	transactionLimit: string;
	dailyDepositLimit: string;
	minTxAmount: string;
	maxTxAmount: string;
	allowNonWhitelisted: boolean;
	commissionTiers: CommissionTier[];
}
