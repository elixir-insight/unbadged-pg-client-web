import type { OnboardingOrgRecord } from '$lib/types/organization';

export interface OrganizationDirector {
	id: number;
	name: string;
	aadhaar: string;
	pan: string;
	email: string;
	phone: string;
}

export interface OrganizationBankAccount {
	id: number;
	holderName: string;
	accountNumber: string;
	bankName: string;
	branchName: string;
	ifscCode: string;
	accountType?: string;
}

export interface OrganizationDocumentRow {
	id: string;
	name: string;
	fileName: string;
	category: string;
	uploadedAt: string;
	status: 'UPLOADED' | 'VERIFIED' | 'REJECTED';
}

export interface OrganizationIntegration {
	callbackUrl: string;
	ipAddress: string;
}

const ACRONYMS = new Set(['LLP']);

export function displayValue(value: string | number | null | undefined): string {
	if (value === null || value === undefined || value === '') return '—';
	return String(value);
}

export function formatBusinessType(value: string): string {
	return value
		.split('_')
		.map((word) =>
			ACRONYMS.has(word) ? word : word[0].toUpperCase() + word.slice(1).toLowerCase()
		)
		.join(' ');
}

export function maskAccountNumber(num: string): string {
	if (num.length <= 4) return num;
	return `•••• •••• ${num.slice(-4)}`;
}

export function mapDirectorsFromOrg(org: OnboardingOrgRecord): OrganizationDirector[] {
	if (org.directors.length === 0) return [];

	return org.directors.map((director, index) => ({
		id: director.id ?? index + 1,
		name: director.name ?? '',
		aadhaar: director.aadhar ?? '',
		pan: director.pan ?? '',
		email: director.email ?? '',
		phone: director.phoneNumber ?? ''
	}));
}

export function mapBankAccountsFromOrg(org: OnboardingOrgRecord): OrganizationBankAccount[] {
	return org.bankAccounts.map((account, index) => ({
		id: account.id ?? index + 1,
		holderName: account.holderName,
		accountNumber: account.accountNumber,
		bankName: account.bankName,
		branchName: account.branchName ?? '',
		ifscCode: account.ifscCode,
		accountType: account.accountType
	}));
}

export function mapIntegrationFromOrg(org: OnboardingOrgRecord): OrganizationIntegration {
	return {
		callbackUrl: org.integration.callbackUrl ?? '',
		ipAddress: org.integration.ipAddress ?? ''
	};
}

const DOCUMENT_LABELS: Record<string, string> = {
	COI: 'Certificate of Incorporation',
	GST: 'GST Registration Certificate',
	BANK_PROOF: 'Cancelled Cheque',
	BOARD_RES: 'Board Resolution',
	PAN: 'Authorized Signatory PAN',
	AADHAAR: 'Director Aadhaar',
	DIRECTOR_PAN: 'Director PAN'
};

export function mapDocumentsFromOrg(org: OnboardingOrgRecord): OrganizationDocumentRow[] {
	const businessDocs = org.documents.map((doc) => ({
		id: doc.id,
		name: doc.fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
		fileName: doc.fileName,
		category: doc.fileType || 'Document',
		uploadedAt: doc.createdAt.slice(0, 10),
		status: 'VERIFIED' as const
	}));

	if (businessDocs.length > 0) return businessDocs;

	const seed = org.orgId;
	return [
		{
			id: `${seed}-doc-1`,
			name: 'Incorporation Certificate',
			fileName: `incorp_${String(seed).toLowerCase()}.pdf`,
			category: 'Business',
			uploadedAt: org.createdAt,
			status: 'VERIFIED'
		},
		{
			id: `${seed}-doc-2`,
			name: 'GST Registration',
			fileName: `gst_${String(seed).toLowerCase()}.pdf`,
			category: 'Compliance',
			uploadedAt: org.createdAt,
			status: 'VERIFIED'
		},
		{
			id: `${seed}-doc-3`,
			name: 'Cancelled Cheque',
			fileName: `cheque_${String(seed).toLowerCase()}.pdf`,
			category: 'Banking',
			uploadedAt: org.createdAt,
			status: 'VERIFIED'
		}
	];
}

export function getDirectorDocumentRows(
	org: OnboardingOrgRecord,
	directors: OrganizationDirector[]
): OrganizationDocumentRow[] {
	return directors.flatMap((director, index) => [
		{
			id: `${org.orgId}-dir-${director.id}-aadhaar`,
			name: `${director.name || `Director ${index + 1}`} — Aadhaar`,
			fileName: `aadhaar_${director.id}.pdf`,
			category: DOCUMENT_LABELS.AADHAAR,
			uploadedAt: org.createdAt,
			status: director.aadhaar ? ('VERIFIED' as const) : ('UPLOADED' as const)
		},
		{
			id: `${org.orgId}-dir-${director.id}-pan`,
			name: `${director.name || `Director ${index + 1}`} — PAN`,
			fileName: `pan_${director.id}.pdf`,
			category: DOCUMENT_LABELS.DIRECTOR_PAN,
			uploadedAt: org.createdAt,
			status: director.pan ? ('VERIFIED' as const) : ('UPLOADED' as const)
		}
	]);
}
