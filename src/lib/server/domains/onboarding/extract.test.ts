import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import {
	extractAccountId,
	extractApplicationId,
	extractBankAccounts,
	extractBankDetails,
	extractBusinessType,
	extractDocuments,
	extractOnboardingPrefill,
	extractOrganizationDataArray,
	extractOrganizationRecord,
	extractProfileStatus,
	extractUploadedFieldNames,
	extractVerifications,
	missingOrganizationFields
} from './extract';
import { GetBankAccountsResponseSchema, GetOrganizationResponseSchema } from './schema';

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
		brandName: 'Acme',
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
				{
					...complete,
					brandName: '',
					gstNumber: '',
					industry: '-',
					registeredYear: 0,
					directors: []
				}
			])
		).toEqual(['Brand name', 'GSTIN', 'Industry', 'Registered year', 'Directors']);
	});

	it('returns nothing when there is no record to inspect', () => {
		expect(missingOrganizationFields(null)).toEqual([]);
	});
});

describe('extractOnboardingPrefill', () => {
	// Shape of a real GET .../organization response (values anonymised).
	const org = {
		orgId: 'ORG_1',
		profileStatus: 'IN_PROGRESS',
		businessType: 'SOLE_PROPRIETORSHIP',
		brandName: '',
		orgPan: '**********',
		gstNumber: '27ABCDE1234F1Z8',
		cin: 'U12345MH2018PTC123455',
		orgTan: 'ABCD12345A',
		businessPhone: '9176251739',
		organizationWebsite: 'https://acme.test',
		industry: 'Fintech',
		communicationAddress: 'no 234 main street',
		registeredYear: 2026,
		serviceTypes: [],
		address: {
			address: 'nagar, besant nagar',
			address2: '',
			city: 'chennai',
			country: 'India',
			pinCode: '600090',
			state: 'tamil nadu'
		},
		directors: [
			{
				id: '7',
				name: 'Ada',
				pan: '**********',
				aadhar: '************',
				email: 'ada@x.test',
				phoneNumber: '+919876543210'
			}
		]
	};

	it('maps the saved org into the wizard form shape', () => {
		expect(extractOnboardingPrefill([org])).toEqual({
			businessPan: '**********',
			gstin: '27ABCDE1234F1Z8',
			businessDetails: {
				cin: 'U12345MH2018PTC123455',
				tan: 'ABCD12345A',
				brandName: '',
				phone: '9176251739',
				website: 'https://acme.test',
				industry: 'Fintech',
				registeredYear: 2026,
				communicationAddress: 'no 234 main street',
				address: {
					line1: 'nagar, besant nagar',
					line2: '',
					city: 'chennai',
					state: 'tamil nadu',
					pincode: '600090',
					country: 'India'
				}
			},
			directors: [
				{
					id: 7,
					name: 'Ada',
					pan: '**********',
					aadhaar: '************',
					email: 'ada@x.test',
					phone: '9876543210'
				}
			]
		});
	});

	it('returns null when there is no org record', () => {
		expect(extractOnboardingPrefill([])).toBeNull();
		expect(extractOnboardingPrefill(null)).toBeNull();
	});
});

describe('extractOnboardingPrefill director ids', () => {
	it('reads the director id from `directorId` when `id` is absent', () => {
		const prefill = extractOnboardingPrefill([
			{ directors: [{ directorId: 42, name: 'Ada', phone: '+919876543210' }] }
		]);
		expect(prefill?.directors[0]).toMatchObject({ id: 42, phone: '9876543210' });
	});
});

describe('extractBankDetails', () => {
	it('maps saved accounts into the form shape, reading `id` or `accountId`', () => {
		const [first, second] = extractBankDetails([
			{ id: '4', holderName: 'Acme', accountNumber: '123456789012', ifscCode: 'HDFC0000123' },
			{ accountId: 5, bankName: 'SBI' }
		]);
		expect(first).toMatchObject({
			accountId: 4,
			accountHolderName: 'Acme',
			accountNumber: '123456789012',
			confirmAccountNumber: '123456789012',
			ifscCode: 'HDFC0000123'
		});
		expect(second).toMatchObject({ accountId: 5, bankName: 'SBI', accountHolderName: '' });
	});
});

describe('extractUploadedFieldNames', () => {
	it('keeps only non-empty file names', () => {
		expect(
			extractUploadedFieldNames([{ fileName: 'gstCertificate' }, { fileName: '' }, {}])
		).toEqual(['gstCertificate']);
	});
});

// The backend sends `null` for unset fields. A schema that rejects null fails the whole GET, and
// the wizard then shows an empty step as if nothing was ever saved.
describe('GET responses with null fields', () => {
	it('keeps saved bank accounts when unset audit fields are null', () => {
		const response = v.parse(GetBankAccountsResponseSchema, {
			statusCode: 200,
			message: 'OK',
			pagination: null,
			data: [
				{
					accountId: 12,
					holderName: 'SR Tech',
					accountNumber: '123456789012',
					ifscCode: 'HDFC0000123',
					bankName: 'HDFC',
					branchName: 'Fort',
					accountType: 'CURRENT',
					status: null,
					createdBy: null,
					updatedAt: null,
					updatedBy: null
				}
			]
		});
		expect(extractBankDetails(response.data)).toMatchObject([
			{ accountId: 12, accountHolderName: 'SR Tech', ifscCode: 'HDFC0000123' }
		]);
	});

	// The live failure: `data: Expected (Array | null) but received Array` — one item field of an
	// unexpected type rejected the whole array.
	it('keeps saved bank accounts when a field has an unexpected type', () => {
		const response = v.parse(GetBankAccountsResponseSchema, {
			data: [
				{
					id: '12',
					holderName: 'SR Tech',
					accountNumber: 123456789012,
					ifscCode: 'HDFC0000123',
					bankName: 'HDFC',
					branchName: 'Fort',
					accountType: 'CURRENT',
					status: { code: 'ACTIVE' },
					createdAt: [2026, 9, 28, 10, 30]
				}
			]
		});
		expect(extractBankDetails(response.data)).toMatchObject([
			{ accountId: 12, accountNumber: '123456789012', accountHolderName: 'SR Tech' }
		]);
	});

	it('keeps the saved organization when optional fields are null', () => {
		const response = v.parse(GetOrganizationResponseSchema, {
			data: [
				{
					profileStatus: 'IN PROGRESS',
					orgPan: '**********',
					gstNumber: '27ABCPE1234F1ZB',
					cin: null,
					orgTan: null,
					serviceTypes: null,
					registeredYear: '2020',
					address: { address: 'besant nagar', address2: null, city: 'chennai', country: null },
					directors: [{ id: 7, name: 'Ada', pan: null, aadhar: null, phone: null }],
					verifications: { 'kyb.cin': 'Not Clear', 'kyb.tan': null }
				}
			]
		});
		const prefill = extractOnboardingPrefill(response.data);
		expect(prefill?.gstin).toBe('27ABCPE1234F1ZB');
		expect(prefill?.businessDetails.cin).toBe('');
		expect(prefill?.businessDetails.registeredYear).toBe(2020);
		expect(prefill?.businessDetails.address).toMatchObject({ line1: 'besant nagar', line2: '' });
		expect(prefill?.directors[0]).toMatchObject({ id: 7, name: 'Ada', pan: '' });
		expect(extractVerifications(response.data)).toEqual({ 'kyb.cin': 'Not Clear' });
	});
});
