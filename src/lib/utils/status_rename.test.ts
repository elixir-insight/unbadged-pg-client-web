import { describe, expect, it } from 'vitest';
import {
	enumToDropdownOptions,
	formatStatusLabel,
	isEnumValue,
	BUSINESS_TYPES
} from './status_rename';

describe('formatStatusLabel', () => {
	it('formats single-word enum values', () => {
		expect(formatStatusLabel('PARTNER')).toBe('Partner');
		expect(formatStatusLabel('MERCHANT')).toBe('Merchant');
		expect(formatStatusLabel('PENDING')).toBe('Pending');
		expect(formatStatusLabel('ACTIVE')).toBe('Active');
	});

	it('formats multi-word enum values', () => {
		expect(formatStatusLabel('PARTNERSHIP')).toBe('Partnership');
		expect(formatStatusLabel('SOLE_PROPRIETORSHIP')).toBe('Sole Proprietorship');
		expect(formatStatusLabel('PRIVATE_LIMITED')).toBe('Private Limited');
		expect(formatStatusLabel('IN_PROGRESS')).toBe('In Progress');
		expect(formatStatusLabel('IN_REVIEW')).toBe('In Review');
		expect(formatStatusLabel('APPROVED')).toBe('Approved');
	});

	it('preserves acronyms', () => {
		expect(formatStatusLabel('LLP')).toBe('LLP');
	});

	it('handles already formatted or empty values', () => {
		expect(formatStatusLabel('—')).toBe('—');
		expect(formatStatusLabel('')).toBe('');
		expect(formatStatusLabel('Not Started')).toBe('Not Started');
	});
});

describe('isEnumValue', () => {
	it('detects screaming snake case values', () => {
		expect(isEnumValue('IN_PROGRESS')).toBe(true);
		expect(isEnumValue('PRIVATE_LIMITED')).toBe(true);
	});

	it('rejects non-enum strings', () => {
		expect(isEnumValue('Not Started')).toBe(false);
		expect(isEnumValue('Private Limited')).toBe(false);
	});
});

describe('enumToDropdownOptions', () => {
	it('builds labeled dropdown options from enum values', () => {
		expect(enumToDropdownOptions(BUSINESS_TYPES)).toEqual([
			{ value: 'PARTNERSHIP', label: 'Partnership' },
			{ value: 'PRIVATE_LIMITED', label: 'Private Limited' },
			{ value: 'LLP', label: 'LLP' },
			{ value: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' }
		]);
	});
});
