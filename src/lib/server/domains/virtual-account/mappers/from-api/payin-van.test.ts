import { describe, expect, it } from 'vitest';
import {
	findPayinVirtualAccount,
	isNoPayinVirtualAccountError,
	NO_PAYIN_VAN_CODE,
	NO_PAYIN_VAN_MESSAGE
} from './payin-van';
import type { MerchantVirtualAccount } from '../../schema';

function account(
	overrides: Partial<MerchantVirtualAccount> &
		Pick<MerchantVirtualAccount, 'pipelineRole' | 'virtualAccountNumber'>
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
				pipelineRole: 'PAYOUT',
				virtualAccountNumber: '111'
			}),
			account({
				pipelineRole: 'PAYIN',
				virtualAccountNumber: '222'
			})
		]);

		expect(payin?.virtualAccountNumber).toBe('222');
	});

	it('skips PAYIN accounts with blank VAN numbers', () => {
		const payin = findPayinVirtualAccount([
			account({
				pipelineRole: 'PAYIN',
				virtualAccountNumber: '   '
			}),
			account({
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
					pipelineRole: 'PAYOUT',
					virtualAccountNumber: '111'
				})
			])
		).toBeNull();
	});
});

describe('isNoPayinVirtualAccountError', () => {
	it('detects the setup-state error code', () => {
		expect(
			isNoPayinVirtualAccountError({
				kind: 'http',
				status: 404,
				code: NO_PAYIN_VAN_CODE,
				message: NO_PAYIN_VAN_MESSAGE
			})
		).toBe(true);
	});

	it('rejects other API errors', () => {
		expect(
			isNoPayinVirtualAccountError({
				kind: 'http',
				status: 500,
				message: 'Server error'
			})
		).toBe(false);
		expect(
			isNoPayinVirtualAccountError({
				kind: 'validation',
				message: 'Unexpected response shape'
			})
		).toBe(false);
	});
});
