import { describe, expect, it } from 'vitest';
import { firstValidationError, validateUserForm } from './validation';

const validBase = {
	email: 'user@example.com',
	firstName: 'Jane',
	employeeId: 'EMP-001',
	mobileNumber: '9876543210',
	selectedRoles: ['Admin'],
	reportingManagerId: 'manager-1'
};

describe('validateUserForm', () => {
	it('returns no errors for a valid payload', () => {
		expect(validateUserForm(validBase)).toEqual({});
		expect(firstValidationError(validateUserForm(validBase))).toBeNull();
	});

	it('requires a valid email address', () => {
		const errors = validateUserForm({ ...validBase, email: 'not-an-email' });

		expect(errors.email).toBe('Enter a valid email address');
	});

	it('requires first name', () => {
		const errors = validateUserForm({ ...validBase, firstName: '   ' });

		expect(errors.firstName).toBe('First name is required');
	});

	it('requires employee id', () => {
		const errors = validateUserForm({ ...validBase, employeeId: '   ' });

		expect(errors.employeeId).toBe('Employee ID is required');
	});

	it('requires a valid mobile number', () => {
		const errors = validateUserForm({ ...validBase, mobileNumber: '12345' });

		expect(errors.mobileNumber).toBe('Enter a valid 10-digit Indian mobile number');
	});

	it('requires at least one role', () => {
		const errors = validateUserForm({ ...validBase, selectedRoles: [] });

		expect(errors.selectedRoles).toBe('Select at least one role');
	});

	it('requires a reporting manager', () => {
		const errors = validateUserForm({ ...validBase, reportingManagerId: null });

		expect(errors.reportingManager).toBe('Select a reporting manager');
	});

	it('returns the first validation error message', () => {
		const errors = validateUserForm({
			...validBase,
			email: '',
			firstName: '',
			selectedRoles: []
		});

		expect(firstValidationError(errors)).toBe('Email address is required');
	});
});
