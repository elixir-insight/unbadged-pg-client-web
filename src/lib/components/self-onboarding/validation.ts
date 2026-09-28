import { DOCUMENT_KEYS } from '$lib/types/onboarding';
import type {
	Address,
	BankDetails,
	Director,
	Documents,
	DocumentKey,
	OnboardingFormData
} from '$lib/types/onboarding';
import { isMaskedAadhar, isMaskedPan } from '$lib/validation/organization-kyb';
import { effectiveRegisteredAddress } from '$lib/utils/onboarding-address';
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

export { DOCUMENT_KEYS };

export const DOCUMENT_LABELS: Record<DocumentKey, string> = {
	gstCertificate: 'GST Certificate',
	businessPanCard: 'Business PAN Card',
	uboDeclaration: 'UBO Declaration',
	boardResolution: 'Board Resolution for Authorized Signatory',
	businessCertificate: 'Business Certificate',
	proofOfFunds: 'Proof of Funds',
	addressProof: 'Address Proof',
	businessTan: 'Business TAN',
	aoa: 'Article of Association (AOA)',
	moa: 'Memorandum of Association (MOA)'
};

export function isValidPan(value: string): boolean {
	return PAN_REGEX.test(value);
}

/** 4th PAN character = holder type; the backend only accepts a business PAN held by P/F/C. */
export const BUSINESS_PAN_HOLDER_TYPES = ['P', 'F', 'C'];

/** Individual (P), firm / LLP (F) or company (C) — the only holder types the backend accepts. */
export function hasBusinessPanHolderType(value: string): boolean {
	return BUSINESS_PAN_HOLDER_TYPES.includes(value.charAt(3));
}

/**
 * A masked value (`**********`) is one the backend already holds — it redacts it on GET, and
 * toKybPayload leaves it out of the save — so it counts as valid rather than asking again.
 */
export function isValidBusinessPan(value: string): boolean {
	return isMaskedPan(value) || (isValidPan(value) && hasBusinessPanHolderType(value));
}

export function businessPanError(value: string): string {
	if (isValidBusinessPan(value)) return '';
	if (!isValidPan(value)) return 'Enter a valid 10-character PAN.';
	return 'The 4th character must be P (individual), F (firm / LLP) or C (company).';
}

/**
 * A director's PAN is a personal one: the backend rejects any other holder type with "Personal
 * PAN must be valid and have holder type P" — on the save that document uploads trigger, so
 * without this check the error only ever showed on the Aadhaar/PAN card slots.
 */
export function isValidDirectorPan(value: string): boolean {
	return isMaskedPan(value) || (isValidPan(value) && value.charAt(3) === 'P');
}

export function directorPanError(value: string): string {
	if (isValidDirectorPan(value)) return '';
	if (!isValidPan(value)) return 'Enter a valid 10-character PAN.';
	return 'Enter a personal PAN — the 4th character must be P.';
}

export function isValidDirectorAadhaar(value: string): boolean {
	return isMaskedAadhar(value) || isValidAadhaar(value);
}

const GSTIN_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * The 15th GSTIN character is a check digit over the first 14 (GSTN's base-36 scheme). The
 * backend verifies it and rejects a mismatch as "Invalid GST Format" — check it here so the error
 * shows on the GSTIN field, not on some later save that happens to carry it (e.g. a director
 * document upload, which saves the whole organization first).
 */
export function gstinCheckDigit(first14: string): string {
	let total = 0;
	for (let i = 0; i < 14; i += 1) {
		const product = GSTIN_CHARSET.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2);
		total += Math.floor(product / 36) + (product % 36);
	}
	return GSTIN_CHARSET[(36 - (total % 36)) % 36];
}

/**
 * Every PAN's 4th character is its holder type (Income Tax Department list: company, person,
 * HUF, firm, AOP, trust, BOI, local authority, artificial juridical person, government).
 */
const PAN_HOLDER_TYPES = new Set(['C', 'P', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G']);

/** Characters 3–12 of a GSTIN are the holder's PAN. */
export function gstinPan(gstin: string): string {
	return gstin.slice(2, 12);
}

function hasValidEmbeddedPan(gstin: string): boolean {
	return PAN_HOLDER_TYPES.has(gstinPan(gstin).charAt(3));
}

export function isValidGstin(value: string): boolean {
	return (
		GSTIN_REGEX.test(value) &&
		hasValidEmbeddedPan(value) &&
		gstinCheckDigit(value.slice(0, 14)) === value[14]
	);
}

/**
 * A GSTIN is issued against the business PAN, so the two must agree. Only checkable once the PAN
 * is typed in — a saved PAN comes back masked, and then the backend checks it on save.
 */
export function gstinMatchesBusinessPan(gstin: string, businessPan: string): boolean {
	if (isMaskedPan(businessPan) || !isValidPan(businessPan)) return true;
	return gstinPan(gstin) === businessPan;
}

export function gstinError(value: string, businessPan = ''): string {
	if (!GSTIN_REGEX.test(value)) return 'Enter a valid 15-character GSTIN.';
	if (!hasValidEmbeddedPan(value)) {
		return `Characters 3–12 of a GSTIN are the business PAN, and ${gstinPan(value)} isn’t a valid PAN — re-check it against your GST certificate.`;
	}
	// Format is right but the check digit isn't — almost always a mistyped character. Say so
	// rather than "not valid", which reads like the format is wrong.
	if (!isValidGstin(value)) {
		return 'The last character of this GSTIN doesn’t match the rest — re-check it against your GST certificate.';
	}
	if (!gstinMatchesBusinessPan(value, businessPan)) {
		return `This GSTIN belongs to PAN ${gstinPan(value)}, not the business PAN above — characters 3–12 must match it.`;
	}
	return '';
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

export function requiredDocumentsUploaded(docs: Documents): boolean {
	return DOCUMENT_KEYS.filter((key) => docs[key].required).every((key) => docs[key].uploaded);
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
		isValidDirectorPan(director.pan) &&
		isValidDirectorAadhaar(director.aadhaar) &&
		isValidEmail(director.email) &&
		isValidPhone(director.phone)
	);
}

/** Labels of the fields that keep `isDirectorComplete` false, in form order. */
export function directorFieldIssues(director: Director): string[] {
	const checks: [string, boolean][] = [
		['Name', filled(director.name)],
		['PAN', isValidDirectorPan(director.pan)],
		['Aadhaar', isValidDirectorAadhaar(director.aadhaar)],
		['Email', isValidEmail(director.email)],
		['Phone', isValidPhone(director.phone)]
	];
	return checks.filter(([, ok]) => !ok).map(([label]) => label);
}

/** Both KYC documents the backend needs for every director before the application can submit. */
export function directorDocumentsUploaded(director: Director): boolean {
	return Boolean(director.aadhaarDocument && director.panDocument);
}

export function directorsAreComplete(data: OnboardingFormData): boolean {
	return data.directors.length > 0 && data.directors.every(isDirectorComplete);
}

/** Presence-only check, e.g. for enabling Continue before the Submit-time format errors run. */
export function isDirectorFilled(director: Director): boolean {
	return (
		filled(director.name) &&
		filled(director.pan) &&
		filled(director.aadhaar) &&
		filled(director.email) &&
		filled(director.phone)
	);
}

export function directorsAreFilled(data: OnboardingFormData): boolean {
	return data.directors.length > 0 && data.directors.every(isDirectorFilled);
}

export function isBankAccountComplete(bank: BankDetails): boolean {
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

export function bankAccountsAreComplete(data: OnboardingFormData): boolean {
	return data.bankAccounts.length > 0 && data.bankAccounts.every(isBankAccountComplete);
}

/** Presence-only check, e.g. for enabling Continue before the Submit-time format errors run. */
export function isBankAccountFilled(bank: BankDetails): boolean {
	return (
		filled(bank.accountHolderName) &&
		filled(bank.accountNumber) &&
		filled(bank.confirmAccountNumber) &&
		filled(bank.ifscCode) &&
		filled(bank.bankName) &&
		filled(bank.branchName) &&
		filled(bank.accountType)
	);
}

export function bankAccountsAreFilled(data: OnboardingFormData): boolean {
	return data.bankAccounts.length > 0 && data.bankAccounts.every(isBankAccountFilled);
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
		isValidBusinessPan(data.businessPan) &&
		data.entityType !== null &&
		filled(details.brandName) &&
		isValidGstin(data.gstin) &&
		gstinMatchesBusinessPan(data.gstin, data.businessPan) &&
		isCinValid(details.cin, data.entityType) &&
		isTanValid(details.tan) &&
		filled(details.industry) &&
		isValidRegisteredYear(details.registeredYear) &&
		isValidPhone(details.phone) &&
		isValidWebsite(details.website)
	);
}

/** Presence-only check, e.g. for enabling Continue before the Submit-time format errors run. */
export function isIdentityFilled(data: OnboardingFormData): boolean {
	const details = data.businessDetails;
	const cinFilled = data.entityType !== 'private_limited' || filled(details.cin);
	return (
		filled(data.businessPan) &&
		data.entityType !== null &&
		filled(details.brandName) &&
		filled(data.gstin) &&
		cinFilled &&
		filled(details.industry) &&
		details.registeredYear !== null &&
		filled(details.phone) &&
		filled(details.website)
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

export function isAddressFilled(address: Address): boolean {
	return (
		filled(address.line1) &&
		filled(address.city) &&
		filled(address.state) &&
		filled(address.pincode)
	);
}

// While "Same as communication address" is ticked the registered address is the communication
// one, so checking the effective address skips the hidden registered fields.
export function isProfileComplete(data: OnboardingFormData): boolean {
	const details = data.businessDetails;
	return (
		isAddressComplete(details.communicationAddress) &&
		isAddressComplete(effectiveRegisteredAddress(details))
	);
}

/** Presence-only check, e.g. for enabling Continue before the Submit-time format errors run. */
export function isProfileFilled(data: OnboardingFormData): boolean {
	const details = data.businessDetails;
	return (
		isAddressFilled(details.communicationAddress) &&
		isAddressFilled(effectiveRegisteredAddress(details))
	);
}

export function isStepDataComplete(step: StepId, data: OnboardingFormData): boolean {
	switch (step) {
		case 1:
			return isIdentityComplete(data);
		case 2:
			return isProfileComplete(data);
		case 3:
			return bankAccountsAreComplete(data);
		case 4:
			return directorsAreComplete(data) && data.directors.every(directorDocumentsUploaded);
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
