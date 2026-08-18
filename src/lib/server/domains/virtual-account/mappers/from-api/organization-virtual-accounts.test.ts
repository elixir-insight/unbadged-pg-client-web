import { describe, expect, it } from 'vitest';
import { mapOrganizationVirtualAccounts } from './organization-virtual-accounts';
import type { MerchantVirtualAccount } from '../../schema';

describe('mapOrganizationVirtualAccounts', () => {
	it('maps organization virtual accounts for the dropdown', () => {
		const accounts: MerchantVirtualAccount[] = [
			{
				createdAt: '',
				createdBy: 0,
				dailyDepositLimit: 0,
				dailyTxnAmount: '',
				dailyTxnLimit: 0,
				isNonWhitelistedAllowed: false,
				pipelineClass: 'FACILITATED',
				pipelineCode: 'TEST',
				pipelineRole: 'PAYIN',
				status: 'ACTIVE',
				tps: 20,
				txnAmountMax: 0,
				txnAmountMin: 0,
				updatedAt: '',
				updatedBy: 0,
				vaNumber: 'TEST202610013919',
				virtualAccountNumber: 'TEST202610013919'
			}
		];

		expect(mapOrganizationVirtualAccounts(accounts, 'ORG_2bV', 'Elixir global')).toEqual([
			{
				vanId: 'TEST202610013919',
				vanNumber: 'TEST202610013919',
				orgId: 'ORG_2bV',
				merchantName: 'Elixir global',
				status: 'active'
			}
		]);
	});

	it('skips blank VAN numbers', () => {
		expect(
			mapOrganizationVirtualAccounts(
				[
					{
						createdAt: '',
						isNonWhitelistedAllowed: false,
						pipelineClass: '',
						pipelineCode: '',
						pipelineRole: 'PAYIN',
						status: 'ACTIVE',
						tps: 0,
						updatedAt: '',
						vaNumber: null,
						virtualAccountNumber: '   '
					}
				],
				'ORG_2bV',
				'Elixir global'
			)
		).toEqual([]);
	});
});
