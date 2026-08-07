import { describe, it, expect } from 'vitest';
import { branding } from '$lib/branding';
import { formatUserType, getUserInitials } from './display';

describe('formatUserType', () => {
	it('title-cases uppercase values', () => {
		expect(formatUserType('ROOT')).toBe('Root');
		expect(formatUserType('MEMBER')).toBe('Member');
		expect(formatUserType('ADMIN')).toBe('Admin');
	});

	it('title-cases snake_case values', () => {
		expect(formatUserType('FINANCE_MANAGER')).toBe('Finance Manager');
	});
});

describe('getUserInitials', () => {
	it('uses first and last name initials', () => {
		expect(getUserInitials('Aarav Kapoor')).toBe('AK');
	});

	it('uses first two characters for a single name', () => {
		expect(getUserInitials(branding.name)).toBe(branding.name.slice(0, 2).toUpperCase());
	});
});
