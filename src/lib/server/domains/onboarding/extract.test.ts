import { describe, expect, it } from 'vitest';
import {
	extractAccountId,
	extractApplicationId,
	extractBankAccounts,
	extractBusinessType,
	extractDocuments,
	extractOrganizationDataArray,
	extractOrganizationRecord,
	extractProfileStatus,
	extractVerifications,
	missingOrganizationFields
} from './extract';

// Every extractor here takes the already-unwrapped `data` field of a response envelope — callers
// pass `result.data.data` (apiFetch's Result.data is the *whole* parsed envelope, whose own
// `.data` field is the array/value these pick from), not the whole envelope itself.

describe('extractAccountId', () => {
	it('reads accountId from the first row of data', () => {
		expect(extractAccountId([{ accountId: 42, status: 'PENDING' }])).toBe(42);
	});

	it('coerces a string accountId to a number', () => {
		expect(extractAccountId([{ accountId: '42' }])).toBe(42);
	});

	it('returns undefined for anything else', () => {
		expect(extractAccountId(null)).toBeUndefined();
		expect(extractAccountId(undefined)).toBeUndefined();
		expect(extractAccountId([])).toBeUndefined();
		expect(extractAccountId([{ status: 'PENDING' }])).toBeUndefined();
		expect(extractAccountId([{ accountId: 'not-a-number' }])).toBeUndefined();
	});
});

describe('extractApplicationId', () => {
	it('reads the string value directly', () => {
		expect(extractApplicationId('APP-123')).toBe('APP-123');
	});

	it('falls back to an empty string for anything else', () => {
		expect(extractApplicationId(null)).toBe('');
		expect(extractApplicationId(undefined)).toBe('');
		expect(extractApplicationId(123)).toBe('');
	});
});

describe('extractOrganizationDataArray', () => {
	it('passes an array through unchanged', () => {
		expect(extractOrganizationDataArray([{ id: 1 }])).toEqual([{ id: 1 }]);
	});

	it('returns undefined for anything else', () => {
		expect(extractOrganizationDataArray(null)).toBeUndefined();
		expect(extractOrganizationDataArray('nope')).toBeUndefined();
	});
});

describe('extractOrganizationRecord', () => {
	it('returns data[0], never the array', () => {
		expect(extractOrganizationRecord([{ orgId: 'ORG_1' }, { orgId: 'ORG_2' }])).toEqual({
			orgId: 'ORG_1'
		});
	});

	it('returns undefined when there is no record', () => {
		expect(extractOrganizationRecord([])).toBeUndefined();
		expect(extractOrganizationRecord(null)).toBeUndefined();
	});
});

describe('extractProfileStatus / extractVerifications / extractBusinessType', () => {
	it('read their field off the single org record', () => {
		const data = [
			{
				profileStatus: 'REMARKED',
				businessType: 'PRIVATE_LIMITED',
				verifications: { 'kyb.cin': 'Not clear' }
			}
		];
		expect(extractProfileStatus(data)).toBe('REMARKED');
		expect(extractBusinessType(data)).toBe('PRIVATE_LIMITED');
		expect(extractVerifications(data)).toEqual({ 'kyb.cin': 'Not clear' });
	});

	it('fall back to empty values when there is no record', () => {
		expect(extractProfileStatus(null)).toBe('');
		expect(extractBusinessType(null)).toBe('');
		expect(extractVerifications(null)).toEqual({});
	});
});

describe('extractBankAccounts / extractDocuments', () => {
	it('pass arrays through, defaulting to empty', () => {
		expect(extractBankAccounts([{ id: 1, bankName: 'HDFC' }])).toEqual([
			{ id: 1, bankName: 'HDFC' }
		]);
		expect(extractBankAccounts(null)).toEqual([]);
		expect(extractDocuments([{ fileName: 'gstCertificate' }])).toEqual([
			{ fileName: 'gstCertificate' }
		]);
		expect(extractDocuments(undefined)).toEqual([]);
	});
});

describe('missingOrganizationFields', () => {
	const complete = {
		orgPan: 'ABCDE1234F',
		gstNumber: '22ABCDE1234F1Z5',
		businessPhone: '+919876543210',
		organizationWebsite: 'https://example.com',
		industry: 'Retail',
		registeredYear: 2018,
		communicationAddress: '12, MG Road',
		address: { address: '12, MG Road', city: 'Chennai', state: 'Tamil Nadu', pinCode: '600001' },
		directors: [{ id: 1, name: 'Ravi' }]
	};

	it('returns nothing for a complete record', () => {
		expect(missingOrganizationFields([complete])).toEqual([]);
	});

	it('names empty, placeholder and absent fields', () => {
		expect(
			missingOrganizationFields([
				{ ...complete, gstNumber: '', industry: '-', registeredYear: 0, directors: [] }
			])
		).toEqual(['GSTIN', 'Industry', 'Registered year', 'Directors']);
	});

	it('returns nothing when there is no record to inspect', () => {
		expect(missingOrganizationFields(null)).toEqual([]);
	});
});
