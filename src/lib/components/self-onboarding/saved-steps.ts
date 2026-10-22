import { getDocumentKeyForFieldName } from '$lib/api/onboarding';
import {
	DOCUMENT_KEYS,
	isDocumentRequired,
	parseEntityType,
	type BankDetails,
	type OnboardingPrefill
} from '$lib/types/onboarding';
import { isAddressEmpty } from '$lib/utils/onboarding-address';
import { firstIncompleteStep, type StepId } from './steps';
import {
	isAddressFilled,
	isBankAccountFilled,
	isDirectorFilled,
	directorDocumentsUploaded
} from './validation';

/** What the self-onboarding layout loads from the backend (see +layout.server.ts). */
export interface SavedOnboardingData {
	businessType: string;
	prefill: OnboardingPrefill | null;
	bankAccounts: BankDetails[];
	uploadedFieldNames: string[];
}

function filled(value: string): boolean {
	return value.trim().length > 0;
}

function identitySaved(data: SavedOnboardingData): boolean {
	const prefill = data.prefill;
	if (!prefill) return false;
	const details = prefill.businessDetails;
	const cinFilled = parseEntityType(data.businessType) !== 'private_limited' || filled(details.cin);
	// The PAN comes back masked — still "saved".
	return (
		filled(prefill.businessPan) &&
		filled(details.brandName) &&
		filled(prefill.gstin) &&
		cinFilled &&
		filled(details.industry) &&
		details.registeredYear !== null &&
		filled(details.phone) &&
		filled(details.website)
	);
}

function addressSaved(data: SavedOnboardingData): boolean {
	const details = data.prefill?.businessDetails;
	// The saved addressDetails itself (not the "same as" copy) and a non-empty saved string.
	return Boolean(
		details && !isAddressEmpty(details.communicationAddress) && isAddressFilled(details.address)
	);
}

function bankSaved(data: SavedOnboardingData): boolean {
	return data.bankAccounts.some(
		(bank) => bank.accountId !== undefined && isBankAccountFilled(bank)
	);
}

/** At least one saved director with every required field and both KYC documents. */
function directorsSaved(data: SavedOnboardingData): boolean {
	return (data.prefill?.directors ?? []).some(
		(director) =>
			director.id !== undefined && isDirectorFilled(director) && directorDocumentsUploaded(director)
	);
}

function documentsSaved(data: SavedOnboardingData): boolean {
	const entityType = parseEntityType(data.businessType);
	const uploaded = new Set(data.uploadedFieldNames.map(getDocumentKeyForFieldName));
	return DOCUMENT_KEYS.filter((key) => isDocumentRequired(key, entityType)).every((key) =>
		uploaded.has(key)
	);
}

const STEP_SAVED: Record<Exclude<StepId, 6>, (data: SavedOnboardingData) => boolean> = {
	1: identitySaved,
	2: addressSaved,
	3: bankSaved,
	4: directorsSaved,
	5: documentsSaved
};

/**
 * Steps 1–5 whose data the backend already holds — never what's only typed locally, so a checkmark
 * always means "saved" and the result is the same after a refresh. Step 6 is only ever finished by
 * submitting (the application then turns read-only).
 */
export function savedCompletedSteps(data: SavedOnboardingData): StepId[] {
	return ([1, 2, 3, 4, 5] as const).filter((step) => STEP_SAVED[step](data));
}

/**
 * Whether `step` may be opened: every earlier step is saved, or it carries a management remark
 * the user has to be able to reach and fix.
 */
export function isStepReachable(
	step: StepId,
	completedSteps: readonly number[],
	remarkSteps: readonly number[]
): boolean {
	return step <= firstIncompleteStep(completedSteps) || remarkSteps.includes(step);
}
