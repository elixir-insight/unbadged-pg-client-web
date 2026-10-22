import { getDocumentKeyForFieldName, ORG_DOCUMENT_FIELDS } from '$lib/api/onboarding';
import type { StepId } from '$lib/components/self-onboarding/steps';
import type { DocumentKey } from '$lib/types/onboarding';

export interface RemarkRoute {
	step: StepId;
	field: string;
}

export interface RoutedRemark extends RemarkRoute {
	key: string;
	message: string;
}

/** Merchant wizard keys: `directors[0].pan`. */
const DIRECTOR_BY_INDEX = /^directors\[(\d+)\]\.(.+)$/;
/**
 * Management verification keys: `directors.{id}.pan` or `directors.{id}.documents.aadhar`
 * (see `$lib/onboarding/verificationFields`).
 */
const DIRECTOR_BY_ID = /^directors\.(\d+)\.(.+)$/;
/** Management bank keys: `bankAccounts.{id}.ifscCode`. */
const BANK_BY_ID = /^bankAccounts\.(\d+)\.(.+)$/;

/**
 * Director KYC document fields a remark can name — index form (`panDocument`) and management's
 * `documents.aadhar` / `documents.pan` suffix after `directors.{id}.`.
 */
const DIRECTOR_DOCUMENT_FIELDS: Record<string, 'aadhar' | 'pan'> = {
	aadharDocument: 'aadhar',
	aadhaarDocument: 'aadhar',
	aadharCard: 'aadhar',
	panDocument: 'pan',
	panCard: 'pan',
	'documents.aadhar': 'aadhar',
	'documents.pan': 'pan'
};

/**
 * Merchant bank field ↔ management BANK_FIELDS alias (`holderName` vs `accountHolderName`).
 * Lookup tries both when resolving a remark for a bank control.
 */
const BANK_FIELD_ALIASES: Record<string, string> = {
	accountHolderName: 'holderName',
	holderName: 'accountHolderName'
};

/** The document a remark is about: one director's KYC card, or one org document slot. */
export type RemarkDocument =
	| { kind: 'director'; index: number | null; directorId: string | null; field: 'aadhar' | 'pan' }
	| { kind: 'organization'; key: DocumentKey; fieldName: string };

function parseDirectorKey(
	key: string
): { index: number | null; directorId: string | null; field: string } | null {
	const byIndex = DIRECTOR_BY_INDEX.exec(key);
	if (byIndex) {
		return {
			index: Number(byIndex[1]),
			directorId: null,
			field: byIndex[2] ?? ''
		};
	}
	const byId = DIRECTOR_BY_ID.exec(key);
	if (byId) {
		return {
			index: null,
			directorId: byId[1] ?? null,
			field: byId[2] ?? ''
		};
	}
	return null;
}

/**
 * Which document a `verifications` key points at, or null for a plain form field. Org documents
 * are keyed by their backend field name (ORG_DOCUMENT_FIELDS — management's upload vocabulary),
 * bare or under `documents.`; `kyb.*` keys are always form fields (kyb.businessPan is the number,
 * businessPan the card).
 */
export function remarkDocument(key: string): RemarkDocument | null {
	const director = parseDirectorKey(key);
	if (director) {
		const field = DIRECTOR_DOCUMENT_FIELDS[director.field];
		return field
			? {
					kind: 'director',
					index: director.index,
					directorId: director.directorId,
					field
				}
			: null;
	}
	const fieldName = key.startsWith('documents.') ? key.slice('documents.'.length) : key;
	const documentKey = getDocumentKeyForFieldName(fieldName);
	return documentKey ? { kind: 'organization', key: documentKey, fieldName } : null;
}

function directorFieldLabel(field: string, index: number | null): string {
	const labels: Record<string, string> = {
		name: 'Name',
		aadhar: 'Aadhar',
		pan: 'PAN',
		email: 'Email',
		phoneNumber: 'Phone',
		phone: 'Phone',
		din: 'DIN',
		aadharDocument: 'Aadhaar card',
		aadhaarDocument: 'Aadhaar card',
		aadharCard: 'Aadhaar card',
		panDocument: 'PAN card',
		panCard: 'PAN card',
		'documents.aadhar': 'Aadhaar card',
		'documents.pan': 'PAN card'
	};
	const label = labels[field] ?? field;
	if (index === null || !Number.isFinite(index)) return `Director — ${label}`;
	return `Director ${index + 1} — ${label}`;
}

function bankFieldLabel(field: string): string {
	const labels: Record<string, string> = {
		accountHolderName: 'Account holder name',
		holderName: 'Account holder name',
		accountNumber: 'Account number',
		accountType: 'Account type',
		ifscCode: 'IFSC',
		bankName: 'Bank name',
		branchName: 'Branch name'
	};
	return labels[field] ?? field;
}

function addressFieldLabel(field: string): string {
	const labels: Record<string, string> = {
		address: 'Address line',
		city: 'City',
		state: 'State',
		country: 'Country',
		pinCode: 'Pincode',
		pincode: 'Pincode',
		line1: 'Address line',
		line2: 'Address line 2',
		address2: 'Address line 2'
	};
	return labels[field] ?? field;
}

/**
 * Maps a `verifications` key from GET onboarding to the step and field label.
 * Used by the remark banner and "Fix this →" jumps.
 */
export function routeVerificationKey(key: string): RemarkRoute {
	const identity = (field: string): RemarkRoute => ({ step: 1, field });
	const profile = (field: string): RemarkRoute => ({ step: 2, field });

	// Documents first: a document key would otherwise fall through to the profile catch-all.
	const document = remarkDocument(key);
	if (document?.kind === 'organization') {
		return { step: 5, field: ORG_DOCUMENT_FIELDS[document.key][document.fieldName] };
	}
	if (document?.kind === 'director') {
		return {
			step: 4,
			field: directorFieldLabel(
				document.field === 'aadhar' ? 'aadharDocument' : 'panDocument',
				document.index
			)
		};
	}

	if (key === 'kyb.businessPan' || key.startsWith('kyb.businessPan.')) {
		return identity('Business PAN');
	}
	if (key === 'kyb.gstNumber' || key.startsWith('kyb.gstNumber.')) {
		return identity('GSTIN');
	}
	if (key === 'kyb.cin' || key.startsWith('kyb.cin.')) return identity('CIN');
	if (
		key === 'kyb.tan' ||
		key.startsWith('kyb.tan.') ||
		key === 'orgTan' ||
		key.startsWith('orgTan.')
	) {
		return identity('TAN');
	}
	if (key === 'kyb.industry' || key.startsWith('kyb.industry.')) return identity('Industry');
	if (key === 'kyb.registeredYear' || key.startsWith('kyb.registeredYear.')) {
		return identity('Registered year');
	}
	if (key === 'kyb.businessPhone' || key.startsWith('kyb.businessPhone.')) {
		return identity('Business phone');
	}
	if (key === 'kyb.organizationWebsite' || key.startsWith('kyb.organizationWebsite.')) {
		return identity('Website');
	}
	if (key === 'brandName' || key.startsWith('brandName.')) return identity('Brand name');

	if (key === 'kyb.communicationAddress' || key.startsWith('kyb.communicationAddress.')) {
		return profile('Communication address');
	}
	if (key === 'addressDetails' || key.startsWith('addressDetails.')) {
		const suffix = key.startsWith('addressDetails.') ? key.slice('addressDetails.'.length) : '';
		return profile(addressFieldLabel(suffix));
	}

	if (key === 'bankDetails' || key.startsWith('bankDetails.')) {
		const suffix = key.startsWith('bankDetails.') ? key.slice('bankDetails.'.length) : '';
		return { step: 3, field: bankFieldLabel(suffix) };
	}

	const bankById = BANK_BY_ID.exec(key);
	if (bankById) {
		return { step: 3, field: bankFieldLabel(bankById[2] ?? '') };
	}

	const director = parseDirectorKey(key);
	if (director) {
		return {
			step: 4,
			field: directorFieldLabel(director.field, director.index)
		};
	}

	if (key.startsWith('kyb.')) return profile(key.slice(4));

	return profile(key);
}

export function routeToStep(key: string): StepId {
	return routeVerificationKey(key).step;
}

export function getFieldRemark(
	verifications: Record<string, string> | undefined,
	key: string
): string {
	if (!verifications) return '';
	return verifications[key]?.trim() ? verifications[key] : '';
}

/**
 * First non-empty remark among candidate keys, preserving the actual `verifications` key so
 * FieldRow focus / clearVerification / data-remark-field stay aligned with management writes.
 */
export function findFieldRemark(
	verifications: Record<string, string> | undefined,
	...keys: string[]
): RoutedRemark | undefined {
	if (!verifications) return undefined;
	for (const key of keys) {
		const message = verifications[key];
		if (typeof message === 'string' && message.trim().length > 0) {
			return { key, message, ...routeVerificationKey(key) };
		}
	}
	return undefined;
}

/**
 * Remark on a director form field — accepts merchant `directors[n].*` and management
 * `directors.{id}.*` (including phone / phoneNumber aliases).
 */
export function directorFieldRemark(
	verifications: Record<string, string> | undefined,
	index: number,
	directorId: number | string | undefined,
	field: string
): RoutedRemark | undefined {
	const keys = [`directors[${index}].${field}`];
	if (field === 'phone' || field === 'phoneNumber') {
		keys.push(`directors[${index}].phone`, `directors[${index}].phoneNumber`);
	}
	if (directorId !== undefined && directorId !== '') {
		const id = String(directorId);
		keys.push(`directors.${id}.${field}`);
		if (field === 'phone' || field === 'phoneNumber') {
			keys.push(`directors.${id}.phone`, `directors.${id}.phoneNumber`);
		}
	}
	return findFieldRemark(verifications, ...keys);
}

/**
 * Remark on a bank form field — accepts legacy `bankDetails.*` and management
 * `bankAccounts.{accountId}.*` (including holderName / accountHolderName).
 */
export function bankFieldRemark(
	verifications: Record<string, string> | undefined,
	accountId: number | string | undefined,
	field: string
): RoutedRemark | undefined {
	const alias = BANK_FIELD_ALIASES[field];
	const keys = [`bankDetails.${field}`];
	if (alias) keys.push(`bankDetails.${alias}`);
	if (accountId !== undefined && accountId !== '') {
		const id = String(accountId);
		keys.push(`bankAccounts.${id}.${field}`);
		if (alias) keys.push(`bankAccounts.${id}.${alias}`);
	}
	return findFieldRemark(verifications, ...keys);
}

export function remarksForStep(
	verifications: Record<string, string> | undefined,
	step: StepId
): RoutedRemark[] {
	return allRoutedRemarks(verifications).filter((remark) => remark.step === step);
}

export function allRoutedRemarks(
	verifications: Record<string, string> | undefined
): RoutedRemark[] {
	if (!verifications) return [];
	return Object.entries(verifications)
		.filter(([, message]) => message.trim().length > 0)
		.map(([key, message]) => ({ key, message, ...routeVerificationKey(key) }));
}

/** The remark on one director's Aadhaar/PAN card, if management left one. */
export function directorDocumentRemark(
	verifications: Record<string, string> | undefined,
	index: number,
	field: 'aadhar' | 'pan',
	directorId?: number | string
): RoutedRemark | undefined {
	const id = directorId !== undefined && directorId !== '' ? String(directorId) : null;
	return allRoutedRemarks(verifications).find((remark) => {
		const document = remarkDocument(remark.key);
		if (document?.kind !== 'director' || document.field !== field) return false;
		if (document.index === index) return true;
		if (id !== null && document.directorId === id) return true;
		return false;
	});
}

/** The remark on one org document slot, if management left one. */
export function organizationDocumentRemark(
	verifications: Record<string, string> | undefined,
	key: DocumentKey
): RoutedRemark | undefined {
	return allRoutedRemarks(verifications).find((remark) => {
		const document = remarkDocument(remark.key);
		return document?.kind === 'organization' && document.key === key;
	});
}

/** The field a `directors[n].<field>` or `directors.{id}.<field>` key names. */
export function directorRemarkField(key: string): string | null {
	return parseDirectorKey(key)?.field ?? null;
}

export function directorRemarkIndex(key: string): number | null {
	const match = DIRECTOR_BY_INDEX.exec(key);
	if (!match) return null;
	const index = Number(match[1]);
	return Number.isFinite(index) ? index : null;
}

/** Director id from a management `directors.{id}.*` key, or null. */
export function directorRemarkId(key: string): string | null {
	return DIRECTOR_BY_ID.exec(key)?.[1] ?? null;
}

/** Bank account id from a management `bankAccounts.{id}.*` key, or null. */
export function bankRemarkAccountId(key: string): string | null {
	return BANK_BY_ID.exec(key)?.[1] ?? null;
}
