import { describe, expect, it } from 'vitest';
import {
	firstValidationError,
	formatRoleName,
	isRoleNameTaken,
	normalizeRoleNameKey,
	validateRoleForm
} from './validation';

const validBase = {
	name: 'Finance Manager',
	description: 'Manages finance operations and approvals.',
	selectedPermissionCount: 3
};

describe('validateRoleForm', () => {
	it('returns no errors for a valid payload', () => {
		expect(validateRoleForm(validBase)).toEqual({});
		expect(firstValidationError(validateRoleForm(validBase))).toBeNull();
	});

	it('requires a role name', () => {
		const errors = validateRoleForm({ ...validBase, name: '   ' });

		expect(errors.name).toBe('Role name is required');
	});

	it('requires a description', () => {
		const errors = validateRoleForm({ ...validBase, description: '   ' });

		expect(errors.description).toBe('Description is required');
	});

	it('requires at least one permission', () => {
		const errors = validateRoleForm({ ...validBase, selectedPermissionCount: 0 });

		expect(errors.permissions).toBe('Select at least one permission');
	});

	it('rejects a duplicate role name', () => {
		const errors = validateRoleForm({
			...validBase,
			name: 'Finance Manager',
			existingRoleNames: ['FINANCE_MANAGER', 'ADMIN']
		});

		expect(errors.name).toBe('Role name already exists. Please choose a different name.');
	});

	it('allows the current name when editing', () => {
		const errors = validateRoleForm({
			...validBase,
			name: 'Finance Manager',
			existingRoleNames: ['FINANCE_MANAGER'],
			excludeRoleName: 'Finance Manager'
		});

		expect(errors.name).toBeUndefined();
	});

	it('returns the first validation error message', () => {
		const errors = validateRoleForm({
			...validBase,
			name: '',
			description: '',
			selectedPermissionCount: 0
		});

		expect(firstValidationError(errors)).toBe('Role name is required');
	});
});

describe('normalizeRoleNameKey / isRoleNameTaken', () => {
	it('treats spaces and underscores as equivalent', () => {
		expect(normalizeRoleNameKey('Finance Manager')).toBe('financemanager');
		expect(normalizeRoleNameKey('FINANCE_MANAGER')).toBe('financemanager');
		expect(isRoleNameTaken('Finance Manager', ['FINANCE_MANAGER'])).toBe(true);
		expect(isRoleNameTaken('Ops Lead', ['FINANCE_MANAGER'])).toBe(false);
	});
});

describe('formatRoleName', () => {
	it('converts SCREAMING_SNAKE_CASE to Title Case', () => {
		expect(formatRoleName('HEAD_OF_GLOBAL_PARTNERSHIPS')).toBe('Head Of Global Partnerships');
	});

	it('trims whitespace and returns empty for blank input', () => {
		expect(formatRoleName('  ')).toBe('');
		expect(formatRoleName('  Finance Manager  ')).toBe('Finance Manager');
	});

	it('leaves already formatted names unchanged', () => {
		expect(formatRoleName('Finance Manager')).toBe('Finance Manager');
	});
});
