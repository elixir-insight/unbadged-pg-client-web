import { describe, expect, it } from 'vitest';
import { validateKycInput } from './kyc-validation.schema';

describe('validateKycInput', () => {
	describe('aadhaar', () => {
		it('returns null for a valid 12-digit number', () => {
			expect(validateKycInput('aadhaar', '123456789012')).toBeNull();
		});

		it('strips non-digits and accepts formatted input', () => {
			expect(validateKycInput('aadhaar', '1234 5678 9012')).toBeNull();
		});

		it('returns an error when fewer than 12 digits are provided', () => {
			expect(validateKycInput('aadhaar', '123')).toBe('Aadhaar number must be exactly 12 digits.');
		});

		it('returns an error when more than 12 digits are provided', () => {
			expect(validateKycInput('aadhaar', '1234567890123')).toBe(
				'Aadhaar number must be exactly 12 digits.'
			);
		});

		it('returns an error for an empty value', () => {
			expect(validateKycInput('aadhaar', '')).toBe('Aadhaar number must be exactly 12 digits.');
		});
	});

	describe('pan', () => {
		it('returns null for a valid PAN', () => {
			expect(validateKycInput('pan', 'ABCDE1234F')).toBeNull();
		});

		it('uppercases lowercase input before validating', () => {
			expect(validateKycInput('pan', 'abcde1234f')).toBeNull();
		});

		it('strips non-alphanumeric characters before validating', () => {
			expect(validateKycInput('pan', 'ABCDE-1234-F')).toBeNull();
		});

		it('returns an error for an invalid format', () => {
			expect(validateKycInput('pan', 'INVALID')).toBe('PAN must match the format AAAAA9999A.');
		});

		it('returns an error when the PAN is too short', () => {
			expect(validateKycInput('pan', 'ABC123')).toBe('PAN must match the format AAAAA9999A.');
		});
	});
});
