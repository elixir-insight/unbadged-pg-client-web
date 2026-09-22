import { isOrgDocumentUploadSupported } from '$lib/api/onboarding';
import type {
	Address,
	Director,
	Documents,
	DocumentKey,
	OnboardingFormData
} from '$lib/types/onboarding';
import type { StepId } from './steps';

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const ACCOUNT_NUMBER_REGEX = /^[0-9]{9,18}$/;
export const AADHAAR_REGEX = /^[2-9][0-9]{11}$/;
export const CIN_REGEX = /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
export const TAN_REGEX = /^[A-Z]{4}[0-9]{5}[A-Z]$/;
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
export const PHONE_REGEX = /^[6-9][0-9]{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const WEBSITE_REGEX =
	/^(https?:\/\/)?([A-Za-z0-9-]+\.)+[A-Za-z]{2,}(\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=-]*)?$/i;

export const MIN_REGISTERED_YEAR = 1800;

export const DOCUMENT_ACCEPT = '.pdf,.jpeg,.jpg,.png,.heif,.heic';
export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;

export const DOCUMENT_KEYS: DocumentKey[] = [
	'gstCertificate',
	'certificateOfIncorporation',
	'shopActLicence',
	'bankStatement',
	'addressProof'
];

export const DOCUMENT_LABELS: Record<DocumentKey, string> = {
	gstCertificate: 'GST Certificate',
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

export function isValidAadhaar(value: string): boolean {
	return AADHAAR_REGEX.test(value);
}

export function isValidCin(value: string): boolean {
	return CIN_REGEX.test(value);
}

export function isValidTan(value: string): boolean {
	return TAN_REGEX.test(value);
}

export function isValidPincode(value: string): boolean {
	return PINCODE_REGEX.test(value);
}

export function isValidPhone(value: string): boolean {
	return PHONE_REGEX.test(value);
}

export function isValidEmail(value: string): boolean {
	return EMAIL_REGEX.test(value.trim());
}

export function isValidWebsite(value: string): boolean {
	return WEBSITE_REGEX.test(value.trim());
}

export function isValidRegisteredYear(
	value: number | null,
	currentYear = new Date().getFullYear()
): boolean {
	return (
		value !== null &&
		Number.isInteger(value) &&
		value >= MIN_REGISTERED_YEAR &&
		value <= currentYear
	);
}

/**
 * Only blocks on a required document whose upload is actually wired to a confirmed backend
 * field (see isOrgDocumentUploadSupported) — otherwise the step could never be completed for a
 * document type still awaiting confirmation.
 */
export function requiredDocumentsUploaded(
	docs: Documents,
	isSupported: (key: DocumentKey) => boolean = isOrgDocumentUploadSupported
): boolean {
	return DOCUMENT_KEYS.filter((key) => docs[key].required && isSupported(key)).every(
		(key) => docs[key].uploaded
	);
}

export function visibleDocumentKeys(docs: Documents): DocumentKey[] {
	return DOCUMENT_KEYS.filter((key) => docs[key].required || docs[key].uploaded);
}

function filled(value: string): boolean {
	return value.trim().length > 0;
}

export function isDirectorComplete(director: Director): boolean {
	return (
		filled(director.name) &&
		isValidPan(director.pan) &&
		isValidAadhaar(director.aadhaar) &&
		isValidEmail(director.email) &&
		isValidPhone(director.phone)
	);
}

export function directorsAreComplete(data: OnboardingFormData): boolean {
	return data.directors.length > 0 && data.directors.every(isDirectorComplete);
}

export function bankDetailsAreComplete(data: OnboardingFormData): boolean {
	const bank = data.bankDetails;
	return (
		filled(bank.accountHolderName) &&
		isValidAccountNumber(bank.accountNumber) &&
		bank.accountNumber === bank.confirmAccountNumber &&
		isValidIfsc(bank.ifscCode) &&
		filled(bank.bankName) &&
		filled(bank.branchName) &&
		filled(bank.accountType)
	);
}

/** CIN is mandatory for private limited companies and optional (format-checked) otherwise. */
export function isCinValid(cin: string, entityType: OnboardingFormData['entityType']): boolean {
	if (cin === '') return entityType !== 'private_limited';
	return isValidCin(cin);
}

export function isTanValid(tan: string): boolean {
	return tan === '' || isValidTan(tan);
}

export function isIdentityComplete(data: OnboardingFormData): boolean {
	const details = data.businessDetails;
	return (
		isValidPan(data.businessPan) &&
		data.entityType !== null &&
		isValidGstin(data.gstin) &&
		isCinValid(details.cin, data.entityType) &&
		isTanValid(details.tan) &&
		filled(details.industry) &&
		isValidRegisteredYear(details.registeredYear)
	);
}

function isAddressComplete(address: Address): boolean {
	return (
		filled(address.line1) &&
		filled(address.city) &&
		filled(address.state) &&
		isValidPincode(address.pincode)
	);
}

export function isProfileComplete(data: OnboardingFormData): boolean {
	const details = data.businessDetails;
	return (
		filled(details.brandName) &&
		isValidPhone(details.phone) &&
		isValidWebsite(details.website) &&
		filled(details.communicationAddress) &&
		isAddressComplete(details.address)
	);
}

export function isStepDataComplete(step: StepId, data: OnboardingFormData): boolean {
	switch (step) {
		case 1:
			return isIdentityComplete(data);
		case 2:
			return isProfileComplete(data);
		case 3:
			return bankDetailsAreComplete(data);
		case 4:
			return directorsAreComplete(data);
		case 5:
			return requiredDocumentsUploaded(data.documents);
		case 6:
			return true;
	}
}

export function allRequiredComplete(data: OnboardingFormData): boolean {
	return ([1, 2, 3, 4, 5] as const).every((step) => isStepDataComplete(step, data));
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
