import { describe, expect, it } from 'vitest';
import { TransferStore, transferMethods, virtualAccounts } from './fund-transfer.svelte';

const imps = transferMethods[0];
const upi = transferMethods.find((m) => m.id === 'UPI')!;
const operationsAccount = virtualAccounts[0];

function validBankBeneficiary() {
	return {
		name: 'Surendran',
		accountNumber: '607393774',
		confirmAccountNumber: '607393774',
		ifsc: 'IDIB000BO68',
		bankName: 'Indian Bank',
		upiId: ''
	};
}

describe('TransferStore', () => {
	it('defaults to IMPS as the selected transfer method', () => {
		const store = new TransferStore();
		expect(store.selectedMethod).toEqual(imps);
	});

	it('starts with no selected account and an empty beneficiary', () => {
		const store = new TransferStore();
		expect(store.selectedAccount).toBeNull();
		expect(store.beneficiary.name).toBe('');
		expect(store.amount).toBe(0);
	});

	it('selectAccount sets the selected account', () => {
		const store = new TransferStore();
		store.selectAccount(operationsAccount);
		expect(store.selectedAccount).toEqual(operationsAccount);
	});

	it('selectMethod switches the selected method', () => {
		const store = new TransferStore();
		store.selectMethod(upi);
		expect(store.selectedMethod).toEqual(upi);
		expect(store.isUpi).toBe(true);
	});

	it('clearStep1 resets the account and beneficiary, but keeps IMPS as the default method', () => {
		const store = new TransferStore();
		store.selectAccount(operationsAccount);
		store.selectMethod(upi);
		store.beneficiary = { ...validBankBeneficiary() };
		store.amount = 1000;
		store.remarks = 'test remarks';

		store.clearStep1();

		expect(store.selectedAccount).toBeNull();
		expect(store.selectedMethod).toEqual(imps);
		expect(store.beneficiary.name).toBe('');
		expect(store.amount).toBe(0);
		expect(store.remarks).toBe('');
	});

	it('isStep1Valid is false until account, amount, and beneficiary details are complete', () => {
		const store = new TransferStore();
		expect(store.isStep1Valid).toBe(false);

		store.selectAccount(operationsAccount);
		expect(store.isStep1Valid).toBe(false);

		store.amount = 1000;
		expect(store.isStep1Valid).toBe(false);

		store.beneficiary = validBankBeneficiary();
		expect(store.isStep1Valid).toBe(true);
	});

	it('isStep1Valid is false when the amount exceeds the account limit', () => {
		const store = new TransferStore();
		store.selectAccount(operationsAccount);
		store.beneficiary = validBankBeneficiary();
		store.amount = operationsAccount.limit + 1;

		expect(store.isStep1Valid).toBe(false);
	});

	it('isStep1Valid requires matching account numbers for bank transfers', () => {
		const store = new TransferStore();
		store.selectAccount(operationsAccount);
		store.amount = 1000;
		store.beneficiary = { ...validBankBeneficiary(), confirmAccountNumber: 'mismatch' };

		expect(store.isStep1Valid).toBe(false);
	});

	it('isStep1Valid only requires a UPI ID for UPI transfers', () => {
		const store = new TransferStore();
		store.selectMethod(upi);
		store.selectAccount(operationsAccount);
		store.amount = 1000;
		store.beneficiary = {
			name: 'Surendran',
			accountNumber: '',
			confirmAccountNumber: '',
			ifsc: '',
			bankName: '',
			upiId: 'surendran@upi'
		};

		expect(store.isStep1Valid).toBe(true);
	});

	it('step1Hint guides the user through each missing field in order', () => {
		const store = new TransferStore();
		expect(store.step1Hint).toBe('Select a source virtual account to continue.');

		store.selectAccount(operationsAccount);
		expect(store.step1Hint).toBe('Enter a transfer amount.');

		store.amount = 1000;
		expect(store.step1Hint).toBe('Beneficiary name is required.');

		store.beneficiary = validBankBeneficiary();
		expect(store.step1Hint).toBe('All details look good — proceed to review.');
	});
});
