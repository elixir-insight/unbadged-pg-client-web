import { describe, expect, it } from 'vitest';
import {
	firstInvalidSignUpField,
	getPasswordStrength,
	isSignUpFormValid,
	validateSignUp,
	validateSignUpField
} from './sign-up';

const validSignup = {
	legalCompanyName: 'Acme Payments Pvt Ltd',
	businessType: 'PRIVATE_LIMITED',
	userEmail: 'owner@acme.test',
	phoneNumber: '9876543210',
	password: 'SecurePass1!',
	affiliateId: ''
};

describe('sign-up validation', () => {
	it('accepts a valid payload', () => {
		expect(validateSignUp(validSignup)).toEqual({});
		expect(isSignUpFormValid(validSignup)).toBe(true);
	});

	it('requires a legal company name', () => {
		expect(
			validateSignUpField('legalCompanyName', { ...validSignup, legalCompanyName: '  ' })
		).toBe("Enter your company's legal name.");
	});

	it('requires a business type from the enum', () => {
		expect(validateSignUpField('businessType', { ...validSignup, businessType: '' })).toBe(
			'Select a business type.'
		);
		expect(validateSignUpField('businessType', { ...validSignup, businessType: 'LLP' })).toBe(
			'Select a business type.'
		);
		expect(
			validateSignUpField('businessType', {
				...validSignup,
				businessType: 'SOLE_PROPRIETORSHIP'
			})
		).toBe('');
	});

	it('requires a valid email address', () => {
		expect(validateSignUpField('userEmail', { ...validSignup, userEmail: 'not-an-email' })).toBe(
			'Enter a valid email address.'
		);
	});

	it('requires a 10-digit Indian mobile number', () => {
		expect(validateSignUpField('phoneNumber', { ...validSignup, phoneNumber: '12345' })).toBe(
			'Enter a valid 10-digit mobile number.'
		);
		expect(validateSignUpField('phoneNumber', { ...validSignup, phoneNumber: '5876543210' })).toBe(
			'Enter a valid 10-digit mobile number.'
		);
		expect(
			validateSignUpField('phoneNumber', { ...validSignup, phoneNumber: '+91 98765 43210' })
		).toBe('');
	});

	it('requires 12-50 characters with upper, lower, number, and special', () => {
		expect(validateSignUpField('password', { ...validSignup, password: 'Secret1!' })).toBe(
			'Password must be 12-50 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.'
		);
		expect(validateSignUpField('password', { ...validSignup, password: 'secret123456' })).toBe(
			'Password must be 12-50 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.'
		);
		expect(validateSignUpField('password', { ...validSignup, password: 'SecurePass1!' })).toBe('');
	});

	it('treats affiliate ID as optional and trims it', () => {
		expect(validateSignUp({ ...validSignup, affiliateId: '  partner-1  ' })).toEqual({});
		expect(isSignUpFormValid({ ...validSignup, affiliateId: '' })).toBe(true);
	});

	it('returns the first invalid required field in layout order', () => {
		expect(
			firstInvalidSignUpField({
				password:
					'Password must be 12-50 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
				userEmail: 'Enter a valid email address.'
			})
		).toBe('userEmail');
	});

	it('reports live password strength', () => {
		expect(getPasswordStrength('')).toBe('empty');
		expect(getPasswordStrength('abc')).toBe('weak');
		expect(getPasswordStrength('SecurePass1!')).toBe('strong');
	});
});
