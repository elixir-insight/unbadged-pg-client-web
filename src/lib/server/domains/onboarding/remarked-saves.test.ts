import { describe, expect, it } from 'vitest';
import {
	filterRemarkedBankAccounts,
	isBankAccountEditableWhenRemarked,
	isOrgDocumentEditableWhenRemarked,
	isRemarkedProfileStatus
} from './remarked-saves';
import type { BankDetails } from '$lib/types/onboarding';

const bank = (accountId?: number): BankDetails => ({
	accountId,
	accountHolderName: 'Acme',
	accountNumber: '123456789012',
	confirmAccountNumber: '123456789012',
	ifscCode: 'HDFC0000123',
	bankName: 'HDFC',
	branchName: 'Fort',
	accountType: 'CURRENT'
});

describe('isRemarkedProfileStatus', () => {
	it('recognizes REMARKED', () => {
		expect(isRemarkedProfileStatus('REMARKED')).toBe(true);
		expect(isRemarkedProfileStatus('IN_REVIEW')).toBe(false);
	});
});

describe('remarked bank saves', () => {
	it('allows the account named by management bankAccounts.{id}.* remarks', () => {
		expect(isBankAccountEditableWhenRemarked(bank(55), ['bankAccounts.55.ifscCode'])).toBe(true);
		expect(isBankAccountEditableWhenRemarked(bank(99), ['bankAccounts.55.ifscCode'])).toBe(false);
	});

	it('allows legacy bankDetails.* remarks for any saved account', () => {
		expect(isBankAccountEditableWhenRemarked(bank(55), ['bankDetails.ifscCode'])).toBe(true);
		expect(filterRemarkedBankAccounts([bank(1), bank(2)], ['bankDetails.ifscCode'])).toHaveLength(
			2
		);
	});

	it('blocks all bank saves when there are no bank remarks', () => {
		expect(isBankAccountEditableWhenRemarked(bank(55), ['kyb.cin'])).toBe(false);
		expect(filterRemarkedBankAccounts([bank(55)], ['kyb.cin'])).toEqual([]);
	});
});

describe('remarked org document saves', () => {
	it('allows the rejected document field', () => {
		expect(
			isOrgDocumentEditableWhenRemarked('gstCertificate', 'gstCertificate', [
				'documents.gstCertificate'
			])
		).toBe(true);
		expect(
			isOrgDocumentEditableWhenRemarked('gstCertificate', 'gstCertificate', ['gstCertificate'])
		).toBe(true);
	});

	it('blocks documents that were not rejected', () => {
		expect(isOrgDocumentEditableWhenRemarked('aoa', 'aoa', ['documents.gstCertificate'])).toBe(
			false
		);
	});
});
