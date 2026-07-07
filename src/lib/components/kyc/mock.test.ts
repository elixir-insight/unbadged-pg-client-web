import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	createVerificationRefId,
	formatAadhaarDisplay,
	maskAadhaar,
	mockAadhaarResult,
	mockPanResult,
	sanitizeAadhaar,
	sanitizePan
} from './mock';

describe('sanitizeAadhaar', () => {
	it('removes non-digit characters', () => {
		expect(sanitizeAadhaar('1234 5678 9012')).toBe('123456789012');
	});

	it('truncates input to 12 digits', () => {
		expect(sanitizeAadhaar('123456789012345')).toBe('123456789012');
	});
});

describe('sanitizePan', () => {
	it('removes non-alphanumeric characters and uppercases', () => {
		expect(sanitizePan('abcde-1234-f')).toBe('ABCDE1234F');
	});

	it('truncates input to 10 characters', () => {
		expect(sanitizePan('ABCDE1234FEXTRA')).toBe('ABCDE1234F');
	});
});

describe('formatAadhaarDisplay', () => {
	it('groups digits into blocks of four', () => {
		expect(formatAadhaarDisplay('123456789012')).toBe('1234 5678 9012');
	});
});

describe('maskAadhaar', () => {
	it('masks all but the last four digits', () => {
		expect(maskAadhaar('123456789012')).toBe('XXXX XXXX 9012');
	});
});

describe('createVerificationRefId', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('generates a ref ID in the expected format', () => {
		vi.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2026);
		vi.spyOn(Math, 'random').mockReturnValue(0.123456);

		expect(createVerificationRefId()).toBe('KYC-2026-211110');
	});

	it('generates a six-digit suffix between 100000 and 999999', () => {
		expect(createVerificationRefId()).toMatch(/^KYC-\d{4}-\d{6}$/);
	});
});

describe('mockAadhaarResult', () => {
	it('returns a verified result with masked aadhaar and last four digits', () => {
		const result = mockAadhaarResult('123456789012');

		expect(result.aadhaar_number).toBe('XXXX XXXX 9012');
		expect(result.last_digits).toBe('9012');
		expect(result.verification_status).toBe('Verified');
		expect(result.full_name).toBe('Ramesh Kumar Iyer');
	});
});

describe('mockPanResult', () => {
	it('returns a verified result with pan details', () => {
		const result = mockPanResult('ABCDE1234F');

		expect(result.pan_number).toBe('ABCDE1234F');
		expect(result.verification_status).toBe('Verified');
		expect(result.pan_details.full_name).toBe('Ramesh Kumar Iyer');
		expect(result.pan_details.father_name).toBe('Suresh Kumar Iyer');
	});
});
