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
				director.name && director.pan && director.email && director.phone && director.designation
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

export function merchantActivationValid(org: Organization, agreementConfirmed: boolean): boolean {
	const p = org.payoutConfiguration;
	const limitsOk = Boolean(
		p.securityDeposit &&
		p.dailyTxnLimit &&
		p.txnAmountMin &&
		p.txnAmountMax &&
		p.dailyDepositLimit &&
		p.bankPipeline
	);
	const methodsOk =
		p.allowedTransactionTypes.length > 0 &&
		p.allowedTransactionTypes.every((m) => {
			const min = Number(m.txnAmountMin) || 0;
			const max = Number(m.txnAmountMax) || 0;
			const daily = Number(m.dailyTxnLimit) || 0;
			const parentMin = Number(p.txnAmountMin) || 0;
			const parentMax = Number(p.txnAmountMax) || 0;
			if (min === 0 || max === 0 || daily === 0) return false;
			if (min > max) return false;
			if (parentMax > 0 && max > parentMax) return false;
			if (parentMin > 0 && min < parentMin) return false;
			return true;
		});
	const totalDaily = p.allowedTransactionTypes.reduce(
		(sum, m) => sum + (Number(m.dailyTxnLimit) || 0),
		0
	);
	const parentDaily = Number(p.dailyTxnLimit) || 0;
	const withinDailyCap = parentDaily === 0 || totalDaily <= parentDaily;

	const commissionOk =
		org.commissionRules.length >= 2 &&
		org.commissionRules.every(
			(rule) => rule.baseAmount && rule.method && rule.gatewayFee && rule.partnerFee
		);

	const agreementOk = agreementConfirmed && activationDocumentReady();

	return limitsOk && methodsOk && withinDailyCap && commissionOk && agreementOk;
}
