import { describe, expect, it } from 'vitest';
import { findPayinVirtualAccount } from './payin-van';
import type { MerchantVirtualAccount } from '../../schema';

function account(
	overrides: Partial<MerchantVirtualAccount> &
		Pick<MerchantVirtualAccount, 'id' | 'pipelineRole' | 'virtualAccountNumber'>
): MerchantVirtualAccount {
	return {
		createdAt: '',
		createdBy: 0,
		dailyDepositLimit: '',
		dailyTxnAmount: '',
		dailyTxnLimit: '',
		isNonWhitelistedAllowed: false,
		pipelineClass: '',
		pipelineCode: '',
		status: 'ACTIVE',
		tps: 0,
		txnAmountMax: '',
		txnAmountMin: '',
		updatedAt: '',
		updatedBy: 0,
		...overrides
	};
}

describe('findPayinVirtualAccount', () => {
	it('returns the first PAYIN account with a VAN number', () => {
		const payin = findPayinVirtualAccount([
			account({
				id: 'va-payout',
				pipelineRole: 'PAYOUT',
				virtualAccountNumber: '111'
			}),
			account({
				id: 'va-payin',
				pipelineRole: 'PAYIN',
				virtualAccountNumber: '222'
			})
		]);

		expect(payin?.id).toBe('va-payin');
		expect(payin?.virtualAccountNumber).toBe('222');
	});

	it('skips PAYIN accounts with blank VAN numbers', () => {
		const payin = findPayinVirtualAccount([
			account({
				id: 'va-empty',
				pipelineRole: 'PAYIN',
				virtualAccountNumber: '   '
			}),
			account({
				id: 'va-payin',
				pipelineRole: 'PAYIN',
				virtualAccountNumber: '333'
			})
		]);

		expect(payin?.virtualAccountNumber).toBe('333');
	});

	it('returns null when no PAYIN account exists', () => {
		expect(
			findPayinVirtualAccount([
				account({
					id: 'va-payout',
					pipelineRole: 'PAYOUT',
					virtualAccountNumber: '111'
				})
			])
		).toBeNull();
	});
});
