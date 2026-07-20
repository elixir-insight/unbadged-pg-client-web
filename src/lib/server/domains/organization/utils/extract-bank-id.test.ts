import { describe, expect, it } from 'vitest';
import { extractBankAccountId } from './extract-bank-id';

describe('extractBankAccountId', () => {
	it('reads accountId from data array', () => {
		expect(
			extractBankAccountId({
				message: 'ok',
				statusCode: 201,
				data: [{ accountId: 42 }]
			})
		).toBe('42');
	});

	it('reads numeric id from data object', () => {
		expect(
			extractBankAccountId({
				message: 'ok',
				statusCode: 201,
				data: { id: 1001 }
			})
		).toBe('1001');
	});

	it('returns null when missing', () => {
		expect(extractBankAccountId({ message: 'ok', statusCode: 201, data: [] })).toBeNull();
	});
});
