import { describe, expect, it } from 'vitest';
import {
	findActivePayinVirtualAccount,
	findPayinVirtualAccount,
	isActiveVirtualAccountStatus,
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
		vaNumber: null,
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

	it('accepts upstream vaNumber after schema normalization', () => {
		const payin = findPayinVirtualAccount([
			{
				createdAt: '',
				createdBy: 0,
				dailyDepositLimit: '',
				dailyTxnAmount: '',
				dailyTxnLimit: '',
				isNonWhitelistedAllowed: true,
				pipelineClass: 'DIRECT',
				pipelineCode: 'TEST',
				pipelineRole: 'PAYIN',
				status: '',
				tps: 30,
				txnAmountMax: '',
				txnAmountMin: '',
				updatedAt: '',
				updatedBy: 0,
				vaNumber: '',
				virtualAccountNumber: 'TEST202610019122'
			}
		]);

		expect(payin?.virtualAccountNumber).toBe('TEST202610019122');
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

	it('still returns a PAYIN account when status is not ACTIVE', () => {
		const payin = findPayinVirtualAccount([
			account({
				pipelineRole: 'PAYIN',
				virtualAccountNumber: '444',
				status: 'INACTIVE'
			})
		]);

		expect(payin?.virtualAccountNumber).toBe('444');
	});
});

describe('isActiveVirtualAccountStatus', () => {
	it('accepts ACTIVE ignoring case and surrounding whitespace', () => {
		expect(isActiveVirtualAccountStatus('ACTIVE')).toBe(true);
		expect(isActiveVirtualAccountStatus(' active ')).toBe(true);
	});

	it('rejects missing or non-ACTIVE statuses', () => {
		expect(isActiveVirtualAccountStatus('')).toBe(false);
		expect(isActiveVirtualAccountStatus(null)).toBe(false);
		expect(isActiveVirtualAccountStatus('INACTIVE')).toBe(false);
	});
});

describe('findActivePayinVirtualAccount', () => {
	it('returns the ACTIVE PAYIN account', () => {
		const payin = findActivePayinVirtualAccount([
			account({
				pipelineRole: 'PAYOUT',
				virtualAccountNumber: '111',
				status: 'ACTIVE'
			}),
			account({
				pipelineRole: 'PAYIN',
				virtualAccountNumber: 'TEST202610013919',
				status: 'ACTIVE'
			})
		]);

		expect(payin?.virtualAccountNumber).toBe('TEST202610013919');
	});

	it('skips PAYIN accounts that are not ACTIVE', () => {
		expect(
			findActivePayinVirtualAccount([
				account({
					pipelineRole: 'PAYIN',
					virtualAccountNumber: '555',
					status: 'INACTIVE'
				})
			])
		).toBeNull();
	});

	it('prefers an ACTIVE PAYIN account over an earlier inactive PAYIN account', () => {
		const payin = findActivePayinVirtualAccount([
			account({
				pipelineRole: 'PAYIN',
				virtualAccountNumber: 'inactive-van',
				status: 'INACTIVE'
			}),
			account({
				pipelineRole: 'PAYIN',
				virtualAccountNumber: 'TEST202610013919',
				status: 'ACTIVE'
			})
		]);

		expect(payin?.virtualAccountNumber).toBe('TEST202610013919');
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
