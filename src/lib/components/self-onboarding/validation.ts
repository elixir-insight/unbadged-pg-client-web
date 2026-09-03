import type { Documents, DocumentKey, OnboardingFormData } from '$lib/types/onboarding';

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const ACCOUNT_NUMBER_REGEX = /^[0-9]{9,18}$/;

export const DOCUMENT_ACCEPT = '.pdf,.jpeg,.jpg,.png,.heif,.heic';
export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;

export const DOCUMENT_KEYS: DocumentKey[] = [
	'gstCertificate',
	'panCardCopy',
	'certificateOfIncorporation',
	'shopActLicence',
	'bankStatement',
	'addressProof'
];

export const DOCUMENT_LABELS: Record<DocumentKey, string> = {
	gstCertificate: 'GST Certificate',
	panCardCopy: 'PAN Card Copy',
	certificateOfIncorporation: 'Certificate of Incorporation',
	shopActLicence: 'Shop Act Licence',
	bankStatement: 'Bank Statement',
	addressProof: 'Address Proof'
};

export function isValidPan(value: string): boolean {
	return PAN_REGEX.test(value);
}

export function isValidGstin(value: string): boolean {
	return GSTIN_REGEX.test(value);
}

export function isValidIfsc(value: string): boolean {
	return IFSC_REGEX.test(value);
}

export function isValidAccountNumber(value: string): boolean {
	return ACCOUNT_NUMBER_REGEX.test(value);
}

export function requiredDocumentsUploaded(docs: Documents): boolean {
	return DOCUMENT_KEYS.filter((key) => docs[key].required).every((key) => docs[key].uploaded);
}

export function visibleDocumentKeys(docs: Documents): DocumentKey[] {
	return DOCUMENT_KEYS.filter((key) => docs[key].required || docs[key].uploaded);
}

export function directorsAreComplete(data: OnboardingFormData): boolean {
	return (
		data.directors.length > 0 &&
		data.directors.every((director) => director.name.trim().length > 0 && isValidPan(director.pan))
	);
}

export function bankDetailsAreComplete(data: OnboardingFormData): boolean {
	const bank = data.bankDetails;
	return (
		bank.accountHolderName.trim().length > 0 &&
		isValidAccountNumber(bank.accountNumber) &&
		bank.accountNumber === bank.confirmAccountNumber &&
		isValidIfsc(bank.ifscCode)
	);
}

export function allRequiredComplete(data: OnboardingFormData): boolean {
	return (
		isValidPan(data.businessPan) &&
		data.entityType !== null &&
		isValidGstin(data.gstin) &&
		bankDetailsAreComplete(data) &&
		directorsAreComplete(data) &&
		requiredDocumentsUploaded(data.documents)
	);
}

export function maskAccountNumber(accountNumber: string): string {
	if (accountNumber.length === 0) return '—';
	if (accountNumber.length <= 4) return '•'.repeat(accountNumber.length);
	return `${'•'.repeat(8)}${accountNumber.slice(-4)}`;
}

export function formatAddress(
	line1: string,
	line2: string,
	city: string,
	state: string,
	pincode: string
): string {
	return [line1, line2, city, state, pincode].filter((part) => part.trim().length > 0).join(', ');
}
