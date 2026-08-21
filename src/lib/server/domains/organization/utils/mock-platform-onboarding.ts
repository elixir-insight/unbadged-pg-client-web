import type { Cookies } from '@sveltejs/kit';
import {
	createMissingDirectorDocument,
	createOrganization,
	organizations,
	parseOrganizationBusinessType,
	type Organization,
	type OrganizationDirector,
	type OrganizationKyb
} from '$lib/data/mockData';
import { applyOrganizationCategory, isUiOnlyOnboardingCategory } from '$lib/organization/category';
import { readRememberedOrgCategory } from './org-category-cookie';
import type { UpdateOrganizationSectionFormBody } from '../mappers/to-api/update-kyb';
import { backendFileNameToDocumentType } from './document-field-names';
import type { AddBankFormBody } from '../mappers/to-api/bank-account';

const backendFieldNameMap: Record<string, string> = {
	AADHAR_CARD: 'aadharCard',
	PAN_CARD: 'panCard',
	UDYAM_CERTIFICATE: 'udyamCertificate',
	MSME_CERTIFICATE: 'msmeCertificate',
	GST_CERTIFICATE: 'gstCertificate',
	INCORP_CERTIFICATE: 'incorpCertificate',
	BUSINESS_PAN: 'businessPan',
	BUSINESS_PAN_CARD: 'businessPan',
	BUSINESS_TAN: 'businessTan',
	FUNDS_ATTESTATION: 'fundsAttestation',
	UBO_DECLARATION: 'uboDeclaration',
	BOARD_RESOLUTION_FOR_AUTHORIZED_SIGNATORY: 'brDocument',
	RENTAL_AGREEMENT: 'rentalAgreement',
	ELECTRICITY_BILL: 'electricityBill',
	AOA: 'aoa',
	ARTICLE_OF_ASSOCIATION_AOA: 'aoa',
	MOA: 'moa',
	MEMORANDUM_OF_ASSOCIATION_MOA: 'moa',
	ORG_LOGO: 'orgLogo',
	BRAND_LOGO: 'brandLogo',
	VOIDED_CHEQUE: 'voidedCheque',
	BANK_STATEMENT: 'bankStatement',
	BANK_STATEMENT_LAST_3_MONTHS: 'bankStatement'
};

export function isUiOnlyMockOrganization(
	orgId: string,
	cookies?: Cookies,
	category?: string | null
): boolean {
	if (isUiOnlyOnboardingCategory(category)) return true;

	const mock = organizations.find((organization) => organization.id === orgId);
	if (isUiOnlyOnboardingCategory(mock?.category)) return true;

	if (!cookies) return false;
	return isUiOnlyOnboardingCategory(readRememberedOrgCategory(cookies, orgId));
}

export function ensureUiOnlyMockOrganization(
	orgId: string,
	params?: { name?: string; businessTypeLabel?: string }
): Organization {
	const existing = organizations.find((organization) => organization.id === orgId);
	if (existing) {
		const next = applyOrganizationCategory(existing, 'PLATFORM');
		Object.assign(existing, next);
		existing.kyb = next.kyb;
		existing.documents = next.documents;
		return existing;
	}

	const created = createOrganization({
		id: orgId,
		name: params?.name?.trim() || orgId,
		businessType: parseOrganizationBusinessType(params?.businessTypeLabel ?? ''),
		category: 'PLATFORM',
		status: 'IN_PROGRESS',
		kybStatus: 'Not Started',
		createdAt: new Date().toISOString().slice(0, 10),
		assignedAdmin: '',
		serviceTypes: []
	});
	organizations.push(created);
	return created;
}

function asKybBusinessType(value: string): OrganizationKyb['businessType'] {
	if (
		value === 'Sole Proprietorship' ||
		value === 'Partnership' ||
		value === 'LLP' ||
		value === 'Private Limited'
	) {
		return value;
	}
	return 'Private Limited';
}

export function applyMockKybSection(
	organization: Organization,
	body: UpdateOrganizationSectionFormBody
): void {
	organization.businessType = parseOrganizationBusinessType(body.businessType);
	organization.kyb = {
		...organization.kyb,
		businessType: asKybBusinessType(body.businessType),
		gstin: body.gstin,
		businessPan: body.businessPan,
		businessPhone: body.businessPhone,
		industry: body.industry,
		organizationWebsite: body.organizationWebsite,
		registeredYear: body.registeredYear,
		cin: body.cin,
		tan: body.tan,
		brandName: body.brandName?.trim() || organization.kyb.brandName
	};

	if (body.section === 'address') {
		organization.kyb.registeredAddress = { ...body.registeredAddress };
		organization.kyb.communicationAddress = { ...body.communicationAddress };
		organization.addressDetails = { ...body.registeredAddress };
	}

	if (body.section === 'directors') {
		const directors: OrganizationDirector[] = body.directors.map((director, index) => {
			const existing = organization.directors[index];
			const id = existing?.id ?? `director-${index + 1}`;
			return {
				id,
				name: director.name,
				pan: director.pan,
				email: director.email,
				phone: director.phone,
				aadhar: director.aadhar,
				aadharDocument: existing?.aadharDocument ?? createMissingDirectorDocument(`${id}-aadhar`),
				panDocument: existing?.panDocument ?? createMissingDirectorDocument(`${id}-pan`)
			};
		});
		organization.directors = directors;
		organization.kyb.directors = directors;
	}

	organization.kybStatus = 'IN_PROGRESS';
	organization.kyb.verificationStatus = 'In Progress';
}

export function applyMockDocumentUploads(
	organization: Organization,
	formData: FormData,
	directorId?: string
): void {
	const today = new Date().toISOString().slice(0, 10);

	for (const [fieldName, value] of formData.entries()) {
		if (!(value instanceof File) || value.size === 0) continue;

		const normalized = backendFieldNameMap[fieldName.trim().toUpperCase()] ?? fieldName.trim();
		const documentType = backendFileNameToDocumentType[normalized];
		if (documentType) {
			const document = organization.documents.find(
				(candidate) => candidate.documentType === documentType
			);
			if (!document) continue;
			document.fileName = value.name;
			document.uploadedDate = today;
			document.status = 'Uploaded';
			continue;
		}

		if (!directorId) continue;
		const director = organization.directors.find((candidate) => candidate.id === directorId);
		if (!director) continue;

		const slot = fieldName.toLowerCase().includes('aadhar')
			? director.aadharDocument
			: fieldName.toLowerCase().includes('pan')
				? director.panDocument
				: null;
		if (!slot) continue;
		slot.fileName = value.name;
		slot.uploadedDate = today;
		slot.status = 'Uploaded';
	}
}

export function applyMockBankAccount(
	organization: Organization,
	body: AddBankFormBody,
	accountId?: string
): string {
	const id = accountId?.trim() || `bank-${Date.now()}`;
	const nextAccount = { id, ...body };
	const index = organization.bankAccounts.findIndex((account) => account.id === id);

	if (index >= 0) {
		organization.bankAccounts[index] = nextAccount;
	} else {
		organization.bankAccounts = [...organization.bankAccounts, nextAccount];
	}

	return id;
}
