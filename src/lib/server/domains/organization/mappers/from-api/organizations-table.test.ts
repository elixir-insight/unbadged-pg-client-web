import { describe, expect, it } from 'vitest';
import { mapOrganizationsTableResponse } from './organizations-table';

describe('mapOrganizationsTableResponse', () => {
	it('maps the upstream organizations table envelope', () => {
		const mapped = mapOrganizationsTableResponse({
			data: [
				{
					id: 'ORG_2bn',
					name: 'Lancaster and Wheeler Inc',
					businessType: 'PRIVATE_LIMITED',
					category: 'MERCHANT',
					profileStatus: 'APPROVED',
					createdAt: '2026-07-20'
				},
				{
					id: 'ORG_2bm',
					name: 'Example Merchant Pvt Ltd',
					businessType: 'PRIVATE_LIMITED',
					category: 'MERCHANT',
					profileStatus: 'APPROVED',
					createdAt: '2026-07-19'
				},
				{
					id: 'ORG_2bY',
					name: 'ElixirPay',
					businessType: 'PRIVATE_LIMITED',
					category: 'MANAGEMENT',
					profileStatus: 'ACTIVE',
					createdAt: '2026-07-16'
				}
			],
			message: 'Organizations fetched successfully',
			pagination: {
				total: 3,
				page: 1,
				limit: 10
			},
			statusCode: 200,
			statusCounts: [
				{ status: 'ACTIVE', count: 1 },
				{ status: 'APPROVED', count: 2 }
			],
			totalPages: 1
		});

		expect(mapped.organizations).toHaveLength(3);
		expect(mapped.organizations[2]).toMatchObject({
			id: 'ORG_2bY',
			name: 'ElixirPay',
			category: 'MANAGEMENT',
			status: 'ACTIVE'
		});
		expect(mapped.pagination).toEqual({ total: 3, page: 1, limit: 10 });
		expect(mapped.statusCounts).toEqual({
			all: 3,
			IN_PROGRESS: 0,
			APPROVED: 2,
			ACTIVE: 1,
			ON_HOLD: 0,
			FROZEN: 0,
			REJECTED: 0
		});
	});

	it('supports legacy record-shaped statusCounts', () => {
		const mapped = mapOrganizationsTableResponse({
			data: [
				{
					id: 'org_1',
					name: 'Acme Pvt Ltd',
					businessType: 'PRIVATE_LIMITED',
					category: 'MERCHANT',
					createdAt: '2026-01-15T10:00:00Z',
					profileStatus: 'IN_PROGRESS'
				}
			],
			pagination: {
				limit: 5,
				page: 1,
				total: 1
			},
			statusCounts: {
				IN_PROGRESS: 1,
				APPROVED: 0,
				ACTIVE: 0,
				ON_HOLD: 0,
				REJECTED: 0
			}
		});

		expect(mapped.statusCounts).toMatchObject({
			all: 1,
			IN_PROGRESS: 1
		});
	});

	it('falls back to pagination total when status counts are missing', () => {
		const mapped = mapOrganizationsTableResponse({
			data: [],
			pagination: {
				limit: 10,
				page: 1,
				total: 42
			}
		});

		expect(mapped.statusCounts.all).toBe(42);
	});
});
