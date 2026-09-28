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

const DIRECTOR_KEY = /^directors\[(\d+)\]\.(.+)$/;

/**
 * Director KYC document fields a remark can name — the same names management's
 * parseDocumentFileName maps director uploads to (aadharDocument/panDocument, aadharCard/panCard).
 */
const DIRECTOR_DOCUMENT_FIELDS: Record<string, 'aadhar' | 'pan'> = {
	aadharDocument: 'aadhar',
	aadhaarDocument: 'aadhar',
	aadharCard: 'aadhar',
	panDocument: 'pan',
	panCard: 'pan'
};

/** The document a remark is about: one director's KYC card, or one org document slot. */
export type RemarkDocument =
	| { kind: 'director'; index: number; field: 'aadhar' | 'pan' }
	| { kind: 'organization'; key: DocumentKey; fieldName: string };

/**
 * Which document a `verifications` key points at, or null for a plain form field. Org documents
 * are keyed by their backend field name (ORG_DOCUMENT_FIELDS — management's upload vocabulary),
 * bare or under `documents.`; `kyb.*` keys are always form fields (kyb.businessPan is the number,
 * businessPan the card).
 */
export function remarkDocument(key: string): RemarkDocument | null {
	const directorMatch = DIRECTOR_KEY.exec(key);
	if (directorMatch) {
		const field = DIRECTOR_DOCUMENT_FIELDS[directorMatch[2] ?? ''];
		return field ? { kind: 'director', index: Number(directorMatch[1]), field } : null;
	}
	const fieldName = key.startsWith('documents.') ? key.slice('documents.'.length) : key;
	const documentKey = getDocumentKeyForFieldName(fieldName);
	return documentKey ? { kind: 'organization', key: documentKey, fieldName } : null;
}

function directorFieldLabel(field: string, index: number): string {
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
		panCard: 'PAN card'
	};
	const label = labels[field] ?? field;
	return `Director ${index + 1} — ${label}`;
}

function bankFieldLabel(field: string): string {
	const labels: Record<string, string> = {
		accountHolderName: 'Account holder name',
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
		line2: 'Address line 2'
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

	const directorMatch = DIRECTOR_KEY.exec(key);
	if (directorMatch) {
		const index = Number(directorMatch[1]);
		const field = directorMatch[2] ?? '';
		return {
			step: 4,
			field: directorFieldLabel(field, Number.isFinite(index) ? index : 0)
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
	return verifications[key] ?? '';
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
	field: 'aadhar' | 'pan'
): RoutedRemark | undefined {
	return allRoutedRemarks(verifications).find((remark) => {
		const document = remarkDocument(remark.key);
		return document?.kind === 'director' && document.index === index && document.field === field;
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

/** The field a `directors[n].<field>` key names, or null for any other key. */
export function directorRemarkField(key: string): string | null {
	return DIRECTOR_KEY.exec(key)?.[2] ?? null;
}

export function directorRemarkIndex(key: string): number | null {
	const match = DIRECTOR_KEY.exec(key);
	if (!match) return null;
	const index = Number(match[1]);
	return Number.isFinite(index) ? index : null;
}
