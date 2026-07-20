import { describe, expect, it } from 'vitest';
import { mapBankAccounts } from './get-organization';

describe('mapBankAccounts', () => {
	it('maps upstream bank account records into OrganizationBankAccount', () => {
		const accounts = mapBankAccounts([
			{
				id: 3,
				holderName: 'Roslind',
				accountNumber: '97000828001',
				ifscCode: 'IDIB000M094',
				bankName: 'Indian',
				branchName: 'Chennai',
				accountType: 'SAVINGS',
				status: 'ACTIVE'
			},
			{
				id: 1,
				holderName: 'Roslind',
				accountNumber: '97000828002',
				ifscCode: 'IDIB000M094',
				bankName: 'Indian',
				branchName: 'Chennai',
				accountType: 'SAVINGS',
				status: 'ACTIVE'
			}
		]);

		expect(accounts).toEqual([
			{
				id: '3',
				accountHolderName: 'Roslind',
				accountNumber: '97000828001',
				ifscCode: 'IDIB000M094',
				bankName: 'Indian',
				branch: 'Chennai',
				accountType: 'SAVINGS',
				status: 'ACTIVE'
			},
			{
				id: '1',
				accountHolderName: 'Roslind',
				accountNumber: '97000828002',
				ifscCode: 'IDIB000M094',
				bankName: 'Indian',
				branch: 'Chennai',
				accountType: 'SAVINGS',
				status: 'ACTIVE'
			}
		]);
	});

	it('returns an empty array for non-array input', () => {
		expect(mapBankAccounts(null)).toEqual([]);
	});
});
