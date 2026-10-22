import { describe, expect, it } from 'vitest';
import { createOrganizationShell } from '$lib/data/mockData';
import { applyPendingOrganizationName, hasPersistedOrganizationName } from './apply-pending-name';

describe('hasPersistedOrganizationName', () => {
	it('returns false when upstream only has org id placeholders', () => {
		const organization = createOrganizationShell({ id: 'ORG_2bj' });

		expect(hasPersistedOrganizationName(organization, 'ORG_2bj')).toBe(false);
	});

	it('returns true when upstream legalCompanyName is persisted', () => {
		const organization = createOrganizationShell({ id: 'ORG_2bj' });
		organization.kyb.legalCompanyName = 'Acme Inc';

		expect(hasPersistedOrganizationName(organization, 'ORG_2bj')).toBe(true);
	});
});

describe('applyPendingOrganizationName', () => {
	it('replaces orgId placeholder name with the pending create-time name', () => {
		const organization = createOrganizationShell({ id: 'ORG_2bi' });

		const updated = applyPendingOrganizationName(organization, 'Acme Payments', 'ORG_2bi');

		expect(updated.name).toBe('Acme Payments');
		expect(updated.kyb.legalCompanyName).toBe('Acme Payments');
	});

	it('keeps an existing real name from GET details', () => {
		const organization = createOrganizationShell({ id: 'ORG_2bi', name: 'Existing Co' });

		const updated = applyPendingOrganizationName(organization, 'Acme Payments', 'ORG_2bi');

		expect(updated.name).toBe('Existing Co');
	});

	it('replaces placeholder kyb legalCompanyName even when top-level name differs', () => {
		const organization = createOrganizationShell({ id: 'ORG_2bi', name: 'ORG_2bi' });

		const updated = applyPendingOrganizationName(organization, 'Acme Payments', 'ORG_2bi');

		expect(updated.name).toBe('Acme Payments');
		expect(updated.kyb.legalCompanyName).toBe('Acme Payments');
	});
});
