import type { DocumentStatus, DocumentType, Organization } from '$lib/data/mockData';
import {
	documentChoiceGroups,
	fixedRequiredDocuments,
	privateLimitedExtraDocuments
} from '$lib/data/mockData';

const documentApprovalReadyStatuses: DocumentStatus[] = ['Uploaded', 'In Review', 'Approved'];

function isReady(status: DocumentStatus): boolean {
	return documentApprovalReadyStatuses.includes(status);
}

function findDocByType(org: Organization, type: DocumentType) {
	return org.documents.find((document) => document.documentType === type);
}

export function legalComplete(org: Organization): boolean {
	const { kyb } = org;
	const cinRequired = kyb.businessType === 'Private Limited';
	return Boolean(
		kyb.legalCompanyName &&
		kyb.businessType &&
		kyb.gstin &&
		kyb.businessPan &&
		kyb.businessPhone &&
		kyb.industry &&
		kyb.organizationWebsite &&
		kyb.registeredYear &&
		(!cinRequired || kyb.cin)
	);
}

function isAddressFilled(address: {
	line1: string;
	line2: string;
	city: string;
	state: string;
	pincode: string;
	country: string;
}): boolean {
	return Boolean(
		address.line1 &&
		address.line2 &&
		address.city &&
		address.state &&
		address.pincode &&
		address.country
	);
}

export function addressComplete(org: Organization): boolean {
	return (
		isAddressFilled(org.kyb.registeredAddress) && isAddressFilled(org.kyb.communicationAddress)
	);
}

export function directorsComplete(org: Organization): boolean {
	return (
		org.directors.length > 0 &&
		org.directors.every(
			(director) =>
				director.name && director.pan && director.email && director.phone && director.aadhar
		)
	);
}

export function kybComplete(org: Organization): boolean {
	return legalComplete(org) && addressComplete(org) && directorsComplete(org);
}

export function bankDetailsComplete(org: Organization): boolean {
	return org.bankAccounts.some((account) => account.status === 'ACTIVE');
}

export function documentsComplete(org: Organization): boolean {
	const fixedOk = fixedRequiredDocuments.every((type) => {
		const doc = findDocByType(org, type);
		return doc ? isReady(doc.status) : false;
	});
	const groupsOk = documentChoiceGroups.every((group) =>
		group.options.some((type) => {
			const doc = findDocByType(org, type);
			return doc ? isReady(doc.status) : false;
		})
	);
	const privateLimitedOk =
		org.kyb.businessType !== 'Private Limited' ||
		privateLimitedExtraDocuments.every((type) => {
			const doc = findDocByType(org, type);
			return doc ? isReady(doc.status) : false;
		});
	const directorsOk = org.directors.every(
		(director) => isReady(director.aadharDocument.status) && isReady(director.panDocument.status)
	);
	return fixedOk && groupsOk && privateLimitedOk && directorsOk;
}

export function integrationComplete(org: Organization): boolean {
	if (org.category !== 'MERCHANT') return true;
	const integration = org.integration;
	return Boolean(integration?.callbackUrl && integration.whitelistedIp);
}

export function allSectionsComplete(org: Organization): boolean {
	return kybComplete(org) && bankDetailsComplete(org) && documentsComplete(org);
}

export function activationDocumentReady(): boolean {
	// Business agreement document no longer required for activation.
	return true;
}
