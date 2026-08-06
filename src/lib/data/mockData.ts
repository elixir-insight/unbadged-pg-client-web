export type OrganizationCategory = 'MERCHANT' | 'PARTNER';
export type OrganizationStatus =
	'IN_PROGRESS' | 'APPROVED' | 'ACTIVE' | 'ON_HOLD' | 'FROZEN' | 'REJECTED';
export type OrganizationBusinessType =
	'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLP' | 'PRIVATE_LIMITED';
export type KybVerificationStatus = 'Not Started' | 'IN_PROGRESS' | 'VERIFIED' | 'FAILED';
export type BankAccountStatus = 'ACTIVE' | 'ON_HOLD' | 'INACTIVE' | 'BLOCKED' | 'CLOSED';
export type DocumentStatus = 'Pending' | 'Uploaded' | 'In Review' | 'Approved' | 'Rejected';
export type AccountType = 'SAVINGS' | 'CURRENT' | 'NODAL' | 'ESCROW' | 'FOREIGN_CURRENCY';
export type DocumentType =
	| 'GST certificate'
	| 'Business PAN card'
	| 'Cancelled cheque'
	| 'Bank statement (last 3 months)'
	| 'Rental agreement'
	| 'Electricity bill'
	| 'Incorporation certificate'
	| 'Udyam certificate'
	| 'MSME certificate'
	| 'Business TAN'
	| 'Article of Association (AOA)'
	| 'Memorandum of Association (MOA)'
	| 'UBO Declaration'
	| 'Board Resolution for Authorized Signatory'
	| 'Organization logo';

export interface OrganizationAddress {
	line1: string;
	line2: string;
	city: string;
	state: string;
	pincode: string;
	country: string;
}

export interface OrganizationPrimaryContact {
	name: string;
	role: string;
	email: string;
	phone: string;
	timezone: string;
}

export interface OrganizationDocument {
	id: string;
	documentType: DocumentType;
	fileName: string;
	uploadedDate?: string;
	status: DocumentStatus;
	optional?: boolean;
	activationGate?: boolean;
	previewUrl?: string;
	fileType?: string;
}

export type OrganizationDocumentUpload = Pick<
	OrganizationDocument,
	'id' | 'fileName' | 'uploadedDate' | 'status' | 'previewUrl' | 'fileType'
>;

export interface OrganizationDirector {
	id: string;
	name: string;
	pan: string;
	email: string;
	phone: string;
	aadhar: string;
	aadharDocument: OrganizationDocumentUpload;
	panDocument: OrganizationDocumentUpload;
}

export interface OrganizationKyb {
	legalCompanyName: string;
	businessType: 'Sole Proprietorship' | 'Partnership' | 'LLP' | 'Private Limited';
	cin: string;
	tan: string;
	gstin: string;
	businessPan: string;
	businessPhone: string;
	industry: string;
	organizationWebsite: string;
	registeredYear: number | null;
	registeredAddress: OrganizationAddress;
	communicationAddress: OrganizationAddress;
	primaryContact: OrganizationPrimaryContact;
	directors: OrganizationDirector[];
	verificationStatus: 'Not Started' | 'In Progress' | 'Verified' | 'Failed';
	verificationDate?: string;
}

export interface OrganizationBankAccount {
	id: string;
	accountHolderName: string;
	accountNumber: string;
	ifscCode: string;
	bankName: string;
	branch: string;
	accountType: AccountType;
	status: BankAccountStatus;
}

export interface OrganizationIntegration {
	callbackUrl: string;
	whitelistedIp: string;
}

export interface OrganizationMethodLimit {
	transactionType: 'IMPS' | 'NEFT' | 'RTGS' | 'UPI';
	txnAmountMin: string;
	txnAmountMax: string;
	dailyTxnLimit: string;
}

export interface OrganizationPayoutConfiguration {
	securityDeposit: string;
	dailyTxnLimit: string;
	txnAmountMin: string;
	txnAmountMax: string;
	dailyDepositLimit: string;
	bankPipeline: string;
	allowedTransactionTypes: OrganizationMethodLimit[];
	virtualAccountsEnabled: boolean;
}

export type OrganizationServiceType = 'Pay-Ins' | 'Payouts';

export interface OrganizationCommissionRule {
	id: string;
	baseAmount: string;
	method: 'FLATRATE' | 'PERCENTAGE';
	gatewayFee: string;
	partnerFee: string;
}

export interface OrganizationPayinConfiguration {
	configured: false;
}

export interface OrganizationFeeSectionDraft {
	slabs: import('$lib/fee-config/types').FeeSlabRow[];
	effectiveFrom: string;
	effectiveTo: string;
}

export interface OrganizationFeeConfigDraft {
	methodConfigId: string;
	charges: OrganizationFeeSectionDraft | null;
	commission: OrganizationFeeSectionDraft | null;
	partner: OrganizationFeeSectionDraft | null;
	feeConfigId: string | null;
}

export interface Organization {
	[key: string]: unknown;
	id: string;
	name: string;
	businessType: OrganizationBusinessType;
	category: OrganizationCategory;
	status: OrganizationStatus;
	kybStatus: KybVerificationStatus;
	createdAt: string;
	assignedAdmin: string;
	resubmitted?: boolean;
	serviceTypes: OrganizationServiceType[];
	kyb: OrganizationKyb;
	addressDetails: OrganizationAddress;
	directors: OrganizationDirector[];
	bankAccounts: OrganizationBankAccount[];
	documents: OrganizationDocument[];
	integration: OrganizationIntegration | null;
	payoutConfiguration: OrganizationPayoutConfiguration;
	payinConfiguration: OrganizationPayinConfiguration | null;
	commissionRules: OrganizationCommissionRule[];
	affiliateId?: string;
	feeConfigDrafts: OrganizationFeeConfigDraft[];
}

const businessTypeLabelMap: Record<OrganizationBusinessType, OrganizationKyb['businessType']> = {
	SOLE_PROPRIETORSHIP: 'Sole Proprietorship',
	PARTNERSHIP: 'Partnership',
	LLP: 'LLP',
	PRIVATE_LIMITED: 'Private Limited'
};

const businessTypeFromLabelMap: Record<string, OrganizationBusinessType> = {
	'Sole Proprietorship': 'SOLE_PROPRIETORSHIP',
	Partnership: 'PARTNERSHIP',
	LLP: 'LLP',
	'Private Limited': 'PRIVATE_LIMITED'
};

export function parseOrganizationBusinessType(label: string): OrganizationBusinessType {
	return businessTypeFromLabelMap[label] ?? 'PRIVATE_LIMITED';
}

/** Generates a backend-shaped mock org id (e.g. `ORG_2bm`) for orgs created without a live API call. */
export function generateMockOrganizationId(): string {
	let id: string;
	do {
		id = `ORG_${Math.random().toString(36).slice(2, 8)}`;
	} while (organizations.some((organization) => organization.id === id));
	return id;
}

export const fixedRequiredDocuments: DocumentType[] = [
	'GST certificate',
	'Business PAN card',
	'UBO Declaration',
	'Board Resolution for Authorized Signatory'
];

export const documentChoiceGroups: {
	key: string;
	label: string;
	options: DocumentType[];
}[] = [
	{
		key: 'businessCertificate',
		label: 'Business Certificate',
		options: ['Incorporation certificate', 'Udyam certificate', 'MSME certificate']
	},
	{
		key: 'proofOfFunds',
		label: 'Proof of Funds',
		options: ['Cancelled cheque', 'Bank statement (last 3 months)']
	},
	{
		key: 'addressProof',
		label: 'Address Proof',
		options: ['Rental agreement', 'Electricity bill']
	}
];

export const privateLimitedExtraDocuments: DocumentType[] = [
	'Business TAN',
	'Article of Association (AOA)',
	'Memorandum of Association (MOA)'
];

export function createMissingDirectorDocument(
	id: string,
	status: DocumentStatus = 'Pending',
	baseDate?: string
): Pick<OrganizationDocument, 'id' | 'fileName' | 'uploadedDate' | 'status'> {
	return {
		id,
		fileName: status === 'Pending' ? '' : `${id}.pdf`,
		uploadedDate: status === 'Pending' ? undefined : baseDate,
		status
	};
}

const bankNames = [
	'HDFC Bank',
	'ICICI Bank',
	'SBI',
	'Axis Bank',
	'Yes Bank',
	'Kotak Mahindra'
] as const;
const states = ['Tamil Nadu', 'Karnataka', 'Maharashtra', 'Delhi', 'Telangana', 'Gujarat'] as const;
const cities = ['Chennai', 'Bengaluru', 'Mumbai', 'New Delhi', 'Hyderabad', 'Ahmedabad'] as const;
const timezones = ['Asia/Kolkata'] as const;

function pickFrom<const T>(list: readonly T[], seed: number): T {
	return list[seed % list.length];
}

function maskableNumber(seed: number): string {
	return `0004${String(9100000000 + seed).slice(-10)}`;
}

function emptyAddress(): OrganizationAddress {
	return { line1: '', line2: '', city: '', state: '', pincode: '', country: '' };
}

function emptyPayoutConfiguration(): OrganizationPayoutConfiguration {
	return {
		securityDeposit: '',
		dailyTxnLimit: '',
		txnAmountMin: '100',
		txnAmountMax: '',
		dailyDepositLimit: '',
		bankPipeline: '',
		allowedTransactionTypes: [],
		virtualAccountsEnabled: false
	};
}

function pendingDocuments(): OrganizationDocument[] {
	return [
		...fixedRequiredDocuments.map((documentType) => ({
			id: documentType.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
			documentType,
			fileName: '',
			status: 'Pending' as const
		})),
		{
			id: 'organization-logo',
			documentType: 'Organization logo' as const,
			fileName: '',
			status: 'Pending' as const,
			optional: true
		}
	];
}

/** Minimal org used when GET-by-id is unavailable but onboarding must continue. */
export function createOrganizationShell(params: {
	id: string;
	name?: string;
	businessType?: OrganizationBusinessType;
	category?: OrganizationCategory;
	serviceTypes?: OrganizationServiceType[];
}): Organization {
	const name = params.name?.trim() || params.id;
	const businessType = params.businessType ?? 'PRIVATE_LIMITED';
	const category = params.category ?? 'MERCHANT';
	const serviceTypes = params.serviceTypes ?? ['Payouts'];
	const address = emptyAddress();

	return {
		id: params.id,
		name,
		businessType,
		category,
		status: 'IN_PROGRESS',
		kybStatus: 'Not Started',
		createdAt: new Date().toISOString().slice(0, 10),
		assignedAdmin: '',
		serviceTypes,
		kyb: {
			legalCompanyName: name,
			businessType: businessTypeLabelMap[businessType],
			cin: '',
			tan: '',
			gstin: '',
			businessPan: '',
			businessPhone: '',
			industry: '',
			organizationWebsite: '',
			registeredYear: null,
			registeredAddress: address,
			communicationAddress: { ...address },
			primaryContact: {
				name: '',
				role: '',
				email: '',
				phone: '',
				timezone: 'Asia/Kolkata'
			},
			directors: [],
			verificationStatus: 'Not Started'
		},
		addressDetails: address,
		directors: [],
		bankAccounts: [],
		documents: pendingDocuments(),
		integration: category === 'MERCHANT' ? { callbackUrl: '', whitelistedIp: '' } : null,
		payoutConfiguration: emptyPayoutConfiguration(),
		payinConfiguration: serviceTypes.includes('Pay-Ins') ? { configured: false } : null,
		commissionRules: [],
		feeConfigDrafts: []
	};
}

function createAddress(seed: number): OrganizationAddress {
	return {
		line1: `${10 + seed} Business Park Road`,
		line2: `Suite ${100 + seed}`,
		city: pickFrom(cities, seed),
		state: pickFrom(states, seed),
		pincode: `${560000 + seed}`.slice(0, 6),
		country: 'India'
	};
}

function createPrimaryContact(name: string, seed: number): OrganizationPrimaryContact {
	const firstName = name.split(' ')[0] ?? 'Primary';
	return {
		name: `${firstName} Ops`,
		role: 'Operations Manager',
		email: `ops${seed}@${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
		phone: `+91 98${String(10000000 + seed).slice(-8)}`,
		timezone: pickFrom(timezones, seed)
	};
}

function createDirectors(
	name: string,
	seed: number,
	count: number,
	documentStatus: DocumentStatus,
	baseDate: string
): OrganizationDirector[] {
	return Array.from({ length: count }, (_, index) => {
		const id = `${name}-${index + 1}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
		return {
			id,
			name: `${name.split(' ')[0]} Director ${index + 1}`,
			pan: `ABCDE${seed + index}F`,
			email: `director${index + 1}.${seed}@${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
			phone: `97${String(10000000 + seed + index).slice(-8)}`,
			aadhar: `23456789012${index}`,
			aadharDocument: createMissingDirectorDocument(`${id}-aadhar`, documentStatus, baseDate),
			panDocument: createMissingDirectorDocument(`${id}-pan`, documentStatus, baseDate)
		};
	});
}

function createBankAccounts(seed: number, activeCount: number): OrganizationBankAccount[] {
	return Array.from({ length: Math.max(1, activeCount + 1) }, (_, index) => {
		const bankName = pickFrom(bankNames, seed + index);
		return {
			id: `bank-${seed}-${index + 1}`,
			accountHolderName: `Operations Account ${index + 1}`,
			accountNumber: maskableNumber(seed * 17 + index),
			ifscCode: `${bankName.slice(0, 4).toUpperCase()}0${1000 + seed + index}`,
			bankName,
			branch: `${pickFrom(cities, seed + index)} Main Branch`,
			accountType: 'CURRENT',
			status: index < activeCount ? 'ACTIVE' : 'INACTIVE'
		};
	});
}

function createOrgDocument(
	documentType: DocumentType,
	status: DocumentStatus,
	baseDate: string,
	extras?: Pick<OrganizationDocument, 'optional' | 'activationGate'>
): OrganizationDocument {
	return {
		id: documentType.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
		documentType,
		fileName:
			status === 'Pending' ? '' : `${documentType.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
		uploadedDate: status === 'Pending' ? undefined : baseDate,
		status,
		...extras
	};
}

function createDocuments(
	businessType: OrganizationBusinessType,
	baseDate: string,
	requiredStatus: DocumentStatus,
	businessAgreementStatus: DocumentStatus,
	logoStatus: DocumentStatus
): OrganizationDocument[] {
	const requiredTypes: DocumentType[] = [
		...fixedRequiredDocuments,
		...(requiredStatus === 'Pending' ? [] : documentChoiceGroups.map((group) => group.options[0])),
		...(businessType === 'PRIVATE_LIMITED' ? privateLimitedExtraDocuments : [])
	];

	const requiredDocs = requiredTypes.map((documentType) =>
		createOrgDocument(documentType, requiredStatus, baseDate)
	);

	return [
		...requiredDocs,
		createOrgDocument('Organization logo', logoStatus, baseDate, { optional: true })
	];
}

function createIntegration(seed: number, configured: boolean): OrganizationIntegration | null {
	if (!configured) {
		return {
			callbackUrl: '',
			whitelistedIp: ''
		};
	}

	return {
		callbackUrl: `https://api.client${seed}.example.com/payments/callback`,
		whitelistedIp: `203.0.113.${20 + seed}`
	};
}

function createPayoutConfiguration(configured: boolean): OrganizationPayoutConfiguration {
	return {
		securityDeposit: '',
		dailyTxnLimit: '',
		txnAmountMin: '100',
		txnAmountMax: '',
		dailyDepositLimit: '',
		bankPipeline: '',
		allowedTransactionTypes: [],
		virtualAccountsEnabled: configured
	};
}

function createCommissionRules(seed: number): OrganizationCommissionRule[] {
	return [
		{
			id: `commission-${seed}-1`,
			baseAmount: '100',
			method: 'FLATRATE',
			gatewayFee: '0',
			partnerFee: '0'
		},
		{
			id: `commission-${seed}-2`,
			baseAmount: '1000',
			method: 'FLATRATE',
			gatewayFee: '0',
			partnerFee: '0'
		}
	];
}

export function createOrganization(params: {
	id: string;
	name: string;
	businessType: OrganizationBusinessType;
	category: OrganizationCategory;
	status: OrganizationStatus;
	kybStatus: KybVerificationStatus;
	createdAt: string;
	assignedAdmin: string;
	resubmitted?: boolean;
	serviceTypes?: OrganizationServiceType[];
	kybComplete?: boolean;
	bankComplete?: boolean;
	documentsComplete?: boolean;
	businessAgreementReady?: boolean;
	integrationComplete?: boolean;
	affiliateId?: string;
	feeConfigDrafts?: OrganizationFeeConfigDraft[];
}): Organization {
	const seed = Number(params.id.replace(/\D/g, '')) % 97;
	const primaryContact = createPrimaryContact(params.name, seed);
	const address = createAddress(seed);
	const kybBusinessType = businessTypeLabelMap[params.businessType];
	const requiredDocStatus: DocumentStatus = params.documentsComplete ? 'Approved' : 'Pending';
	const directors = createDirectors(
		params.name,
		seed,
		params.kybComplete ? 2 : 1,
		requiredDocStatus,
		params.createdAt
	);
	const businessAgreementStatus: DocumentStatus = params.businessAgreementReady
		? 'Uploaded'
		: 'Pending';
	const integrationConfigured = params.category === 'MERCHANT' && params.integrationComplete;
	const bankAccounts = createBankAccounts(seed, params.bankComplete ? 1 : 0);
	const documents = createDocuments(
		params.businessType,
		params.createdAt,
		requiredDocStatus,
		businessAgreementStatus,
		params.documentsComplete ? 'Uploaded' : 'Pending'
	);

	const panDigits = String(1000 + seed).slice(-4);
	const businessPan = `ABCDE${panDigits}F`;
	const gstin = `29ABCDE${panDigits}F1Z5`;
	const cinValue =
		params.businessType === 'PRIVATE_LIMITED'
			? `U72900KA${2010 + (seed % 15)}PTC${String(100000 + seed).slice(-6)}`
			: '';
	const tanValue = `BLRR${String(10000 + seed).slice(-5)}A`;
	const serviceTypes = params.serviceTypes ?? ['Payouts'];

	return {
		id: params.id,
		name: params.name,
		businessType: params.businessType,
		category: params.category,
		status: params.status,
		kybStatus: params.kybStatus,
		createdAt: params.createdAt,
		assignedAdmin: params.assignedAdmin,
		resubmitted: params.resubmitted,
		serviceTypes,
		kyb: {
			legalCompanyName: params.kybComplete ? `${params.name} Private Entity` : params.name,
			businessType: kybBusinessType,
			cin: params.kybComplete ? cinValue : '',
			tan: params.kybComplete ? tanValue : '',
			gstin: params.kybComplete ? gstin : '',
			businessPan: params.kybComplete ? businessPan : '',
			businessPhone: params.kybComplete ? `98${String(10000000 + seed).slice(-8)}` : '',
			industry: params.kybComplete ? 'Technology' : '',
			organizationWebsite: params.kybComplete ? `https://www.client${seed}.example.com` : '',
			registeredYear: params.kybComplete ? 2010 + (seed % 15) : null,
			registeredAddress: params.kybComplete ? address : emptyAddress(),
			communicationAddress: params.kybComplete ? { ...address } : emptyAddress(),
			primaryContact,
			directors,
			verificationStatus:
				params.kybStatus === 'IN_PROGRESS'
					? 'In Progress'
					: params.kybStatus === 'VERIFIED'
						? 'Verified'
						: params.kybStatus === 'FAILED'
							? 'Failed'
							: 'Not Started',
			verificationDate: params.kybStatus === 'Not Started' ? undefined : params.createdAt
		},
		addressDetails: address,
		directors,
		bankAccounts,
		documents,
		integration:
			params.category === 'MERCHANT'
				? createIntegration(seed, Boolean(integrationConfigured))
				: null,
		payoutConfiguration: createPayoutConfiguration(params.status === 'ACTIVE'),
		payinConfiguration: serviceTypes.includes('Pay-Ins') ? { configured: false } : null,
		commissionRules: createCommissionRules(seed),
		affiliateId: params.affiliateId ?? (params.category === 'MERCHANT' ? 'AFF-HD01' : undefined),
		feeConfigDrafts: params.feeConfigDrafts ?? []
	};
}

export const organizations: Organization[] = [
	createOrganization({
		id: 'ORG-1000',
		name: 'Northwind Capital',
		businessType: 'PARTNERSHIP',
		category: 'MERCHANT',
		status: 'IN_PROGRESS',
		kybStatus: 'Not Started',
		createdAt: '2024-12-31',
		assignedAdmin: 'Sarah Chen'
	}),
	createOrganization({
		id: 'ORG-1002',
		name: 'Lumen Health',
		businessType: 'LLP',
		category: 'PARTNER',
		status: 'ACTIVE',
		kybStatus: 'VERIFIED',
		createdAt: '2025-05-10',
		assignedAdmin: 'Carol Lee',
		kybComplete: true,
		bankComplete: true,
		documentsComplete: true,
		businessAgreementReady: true
	}),
	createOrganization({
		id: 'ORG-1003',
		name: 'Vertex Robotics',
		businessType: 'PRIVATE_LIMITED',
		category: 'MERCHANT',
		status: 'IN_PROGRESS',
		kybStatus: 'Not Started',
		createdAt: '2025-07-15',
		assignedAdmin: 'David Kim'
	}),
	createOrganization({
		id: 'ORG-1005',
		name: 'Orbit PRIVATE_LIMITED',
		businessType: 'PRIVATE_LIMITED',
		category: 'PARTNER',
		status: 'ON_HOLD',
		kybStatus: 'VERIFIED',
		createdAt: '2025-11-25',
		assignedAdmin: 'Eve Torres',
		kybComplete: true,
		bankComplete: true,
		documentsComplete: true,
		businessAgreementReady: true
	}),
	createOrganization({
		id: 'ORG-1006',
		name: 'Stellar Foods',
		businessType: 'SOLE_PROPRIETORSHIP',
		category: 'MERCHANT',
		status: 'IN_PROGRESS',
		kybStatus: 'Not Started',
		createdAt: '2025-01-03',
		assignedAdmin: 'Frank Nguyen'
	}),
	createOrganization({
		id: 'ORG-1007',
		name: 'Pinnacle Wealth Mgmt',
		businessType: 'LLP',
		category: 'MERCHANT',
		status: 'APPROVED',
		kybStatus: 'VERIFIED',
		createdAt: '2025-02-18',
		assignedAdmin: 'Carol Lee',
		kybComplete: true,
		bankComplete: true,
		documentsComplete: true,
		integrationComplete: true,
		affiliateId: 'AFF-HD01'
	}),
	createOrganization({
		id: 'ORG-1009',
		name: 'Horizon Insurance Co',
		businessType: 'PRIVATE_LIMITED',
		category: 'MERCHANT',
		status: 'APPROVED',
		kybStatus: 'VERIFIED',
		createdAt: '2025-06-22',
		assignedAdmin: 'Alice Johnson',
		kybComplete: true,
		bankComplete: true,
		documentsComplete: true,
		integrationComplete: true
	}),
	createOrganization({
		id: 'ORG-1010',
		name: 'Crestline Digital',
		businessType: 'PARTNERSHIP',
		category: 'PARTNER',
		status: 'IN_PROGRESS',
		kybStatus: 'Not Started',
		createdAt: '2025-08-14',
		assignedAdmin: 'David Kim'
	}),
	createOrganization({
		id: 'ORG-1011',
		name: 'Ironclad Payments',
		businessType: 'PRIVATE_LIMITED',
		category: 'MERCHANT',
		status: 'APPROVED',
		kybStatus: 'VERIFIED',
		createdAt: '2025-10-07',
		assignedAdmin: 'Eve Torres',
		kybComplete: true,
		bankComplete: true,
		documentsComplete: true,
		integrationComplete: true
	}),
	createOrganization({
		id: 'ORG-1013',
		name: 'Summit Ventures',
		businessType: 'LLP',
		category: 'PARTNER',
		status: 'ACTIVE',
		kybStatus: 'VERIFIED',
		createdAt: '2026-01-19',
		assignedAdmin: 'Carol Lee',
		kybComplete: true,
		bankComplete: true,
		documentsComplete: true,
		businessAgreementReady: true
	}),
	createOrganization({
		id: 'ORG-1014',
		name: 'Cascade Fintech',
		businessType: 'LLP',
		category: 'MERCHANT',
		status: 'IN_PROGRESS',
		kybStatus: 'IN_PROGRESS',
		createdAt: '2026-03-11',
		assignedAdmin: 'Bob Martinez',
		kybComplete: true,
		bankComplete: false,
		documentsComplete: true,
		integrationComplete: false
	}),
	createOrganization({
		id: 'ORG-1016',
		name: 'Nimbus Fintech',
		businessType: 'LLP',
		category: 'PARTNER',
		status: 'ACTIVE',
		kybStatus: 'VERIFIED',
		createdAt: '2026-01-08',
		assignedAdmin: 'Sarah Chen',
		kybComplete: true,
		bankComplete: true,
		documentsComplete: true,
		businessAgreementReady: true
	}),
	createOrganization({
		id: 'ORG-1017',
		name: 'Vortex Payments',
		businessType: 'LLP',
		category: 'MERCHANT',
		status: 'REJECTED',
		kybStatus: 'FAILED',
		createdAt: '2025-11-14',
		assignedAdmin: 'David Kim',
		kybComplete: true,
		bankComplete: true,
		documentsComplete: false
	}),
	createOrganization({
		id: 'ORG-1019',
		name: 'Kestrel Analytics',
		businessType: 'PARTNERSHIP',
		category: 'PARTNER',
		status: 'APPROVED',
		kybStatus: 'VERIFIED',
		createdAt: '2026-02-27',
		assignedAdmin: 'Frank Nguyen',
		resubmitted: true,
		kybComplete: true,
		bankComplete: true,
		documentsComplete: true
	}),
	createOrganization({
		id: 'ORG-1020',
		name: 'Meridian Payments',
		businessType: 'PRIVATE_LIMITED',
		category: 'MERCHANT',
		status: 'APPROVED',
		kybStatus: 'VERIFIED',
		createdAt: '2025-09-11',
		assignedAdmin: 'Alice Johnson',
		kybComplete: true,
		bankComplete: true,
		documentsComplete: true,
		integrationComplete: true,
		businessAgreementReady: true,
		affiliateId: 'AFF-IC01'
	})
];
