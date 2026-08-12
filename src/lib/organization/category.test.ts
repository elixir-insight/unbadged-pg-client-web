import { describe, expect, it } from 'vitest';
import { createOrganizationShell } from '$lib/data/mockData';
import {
	applyOrganizationCategory,
	parseOrganizationCategory,
	resolveOrganizationCategory
} from './category';

describe('organization category helpers', () => {
	it('parses partner and merchant labels', () => {
		expect(parseOrganizationCategory('partner')).toBe('PARTNER');
		expect(parseOrganizationCategory('MERCHANT')).toBe('MERCHANT');
		expect(parseOrganizationCategory('unknown')).toBeNull();
	});

	it('prefers an explicit URL category over a missing API profile type', () => {
		expect(
			resolveOrganizationCategory({
				fromUrl: 'PARTNER',
				fromApi: 'MERCHANT'
			})
		).toBe('PARTNER');
	});

	it('keeps a remembered partner category when the details API omits profile type', () => {
		expect(
			resolveOrganizationCategory({
				fromMemory: 'PARTNER',
				fromApi: 'MERCHANT'
			})
		).toBe('PARTNER');
	});

	it('adds brand logo and brand name when applying the partner category', () => {
		const merchant = createOrganizationShell({ id: 'org_2be', category: 'MERCHANT' });
		const partner = applyOrganizationCategory(merchant, 'PARTNER');

		expect(partner.category).toBe('PARTNER');
		expect(partner.kyb.brandName).toBe('');
		expect(partner.documents.some((document) => document.documentType === 'Brand logo')).toBe(true);
	});
});
