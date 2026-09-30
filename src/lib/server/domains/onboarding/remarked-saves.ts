import { getDocumentKeyForFieldName, isDocumentFieldName } from '$lib/api/onboarding';
import { resolveOnboardingStatus } from '$lib/components/self-onboarding/steps';
import { bankRemarkAccountId, routeToStep } from '$lib/utils/remarkRouting';
import type { BankDetails, DocumentKey } from '$lib/types/onboarding';

/** True when profileStatus maps to merchant correction mode. */
export function isRemarkedProfileStatus(profileStatus: string): boolean {
	return resolveOnboardingStatus(profileStatus) === 'remarked';
}

/**
 * Whether a bank account may be created/updated while the org is REMARKED.
 * Allows accounts that already have a management remark (`bankAccounts.{id}.*` or legacy
 * `bankDetails.*`), and blocks brand-new accounts / unmarked accounts.
 */
export function isBankAccountEditableWhenRemarked(
	bank: BankDetails,
	rejectedKeys: readonly string[]
): boolean {
	const hasLegacyBankRemark = rejectedKeys.some((key) => routeToStep(key) === 3);
	if (!hasLegacyBankRemark) return false;

	const accountId = bank.accountId;
	if (accountId === undefined) {
		// Creating a new account while remarked is only allowed when remarks are the legacy
		// single-account bankDetails.* shape (no account id in the key).
		return rejectedKeys.some((key) => key === 'bankDetails' || key.startsWith('bankDetails.'));
	}

	const id = String(accountId);
	return rejectedKeys.some((key) => {
		if (key === 'bankDetails' || key.startsWith('bankDetails.')) return true;
		return bankRemarkAccountId(key) === id;
	});
}

/** Filters bank accounts down to those that may be saved in remarked mode. */
export function filterRemarkedBankAccounts(
	banks: BankDetails[],
	rejectedKeys: readonly string[]
): BankDetails[] {
	return banks.filter((bank) => isBankAccountEditableWhenRemarked(bank, rejectedKeys));
}

/**
 * Whether an org document slot may be uploaded while REMARKED — only when management rejected
 * that document (bare field name or `documents.<field>`).
 */
export function isOrgDocumentEditableWhenRemarked(
	documentType: DocumentKey,
	fieldName: string,
	rejectedKeys: readonly string[]
): boolean {
	if (!isDocumentFieldName(documentType, fieldName)) return false;
	return rejectedKeys.some((key) => {
		const bare = key.startsWith('documents.') ? key.slice('documents.'.length) : key;
		if (bare === fieldName) return true;
		return getDocumentKeyForFieldName(bare) === documentType;
	});
}
