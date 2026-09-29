import { describe, expect, it } from 'vitest';
import { findOrganizationTableName, mapOrganizationsTableResponse } from './organizations-table';

describe('findOrganizationTableName', () => {
	it('returns the table name for a matching org id', () => {
		expect(
			findOrganizationTableName(
				[
					{
						id: 'ORG_2bj',
						name: 'Blankenship and Sharp Associates',
						businessType: 'PRIVATE_LIMITED',
						category: 'MERCHANT',
						profileStatus: 'IN_PROGRESS',
						createdAt: '2026-07-20'
					}
				],
				'ORG_2bj'
			)
		).toBe('Blankenship and Sharp Associates');
	});

	it('returns null when the table name is the org id placeholder', () => {
		expect(
			findOrganizationTableName(
				[
					{
						id: 'ORG_2bj',
						name: 'ORG_2bj',
						businessType: 'PRIVATE_LIMITED',
						category: 'MERCHANT',
						profileStatus: 'IN_PROGRESS',
						createdAt: '2026-07-20'
					}
				],
				'ORG_2bj'
			)
		).toBeNull();
	});
});

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
			IN_REVIEW: 0,
			REMARKED: 0,
			APPROVED: 2,
			ACTIVE: 1,
			ON_HOLD: 0,
			FROZEN: 0,
			REJECTED: 0
		});
	});

	it('maps profileStatus to status without defaulting unknown values to IN_PROGRESS', () => {
		const mapped = mapOrganizationsTableResponse({
			data: [
				{
					id: 'ORG_2cL',
					name: 'Finsol Consultancy',
					businessType: 'SOLE_PROPRIETORSHIP',
					category: 'MERCHANT',
					profileStatus: 'IN_PROGRESS',
					createdAt: '2026-09-28'
				},
				{
					id: 'ORG_2cK',
					name: 'Priority Pvt Ltd',
					businessType: 'PARTNERSHIP',
					category: 'MERCHANT',
					profileStatus: 'IN_REVIEW',
					createdAt: '2026-09-28'
				},
				{
					id: 'ORG_2cJ',
					name: 'Wooten Clay Inc',
					businessType: 'PRIVATE_LIMITED',
					category: 'MERCHANT',
					profileStatus: 'ACTIVE',
					createdAt: '2026-09-23'
				}
			],
			pagination: {
				total: 53,
				page: 1,
				limit: 10
			},
			statusCounts: [
				{ status: 'IN_PROGRESS', count: 25 },
				{ status: 'ACTIVE', count: 24 },
				{ status: 'APPROVED', count: 2 },
				{ status: 'IN_REVIEW', count: 2 }
			],
			totalPages: 6
		});

		expect(mapped.organizations).toEqual([
			{
				id: 'ORG_2cL',
				name: 'Finsol Consultancy',
				businessType: 'SOLE_PROPRIETORSHIP',
				category: 'MERCHANT',
				createdAt: '2026-09-28',
				status: 'IN_PROGRESS'
			},
			{
				id: 'ORG_2cK',
				name: 'Priority Pvt Ltd',
				businessType: 'PARTNERSHIP',
				category: 'MERCHANT',
				createdAt: '2026-09-28',
				status: 'IN_REVIEW'
			},
			{
				id: 'ORG_2cJ',
				name: 'Wooten Clay Inc',
				businessType: 'PRIVATE_LIMITED',
				category: 'MERCHANT',
				createdAt: '2026-09-23',
				status: 'ACTIVE'
			}
		]);
		expect(mapped.pagination).toEqual({ total: 53, page: 1, limit: 10 });
		expect(mapped.statusCounts).toEqual({
			all: 53,
			IN_PROGRESS: 25,
			IN_REVIEW: 2,
			REMARKED: 0,
			APPROVED: 2,
			ACTIVE: 24,
			ON_HOLD: 0,
			FROZEN: 0,
			REJECTED: 0
		});
	});

	it('does not convert a future profileStatus into IN_PROGRESS', () => {
		const mapped = mapOrganizationsTableResponse({
			data: [
				{
					id: 'ORG_future',
					name: 'Future Org',
					businessType: 'PRIVATE_LIMITED',
					category: 'MERCHANT',
					profileStatus: 'PENDING_LEGAL',
					createdAt: '2026-09-28'
				}
			],
			pagination: {
				total: 35,
				page: 1,
				limit: 10
			},
			statusCounts: [
				{ status: 'IN_PROGRESS', count: 25 },
				{ status: 'PENDING_LEGAL', count: 10 }
			]
		});

		expect(mapped.organizations[0]?.status).toBe('PENDING_LEGAL');
		expect(mapped.statusCounts).toEqual({
			all: 35,
			IN_PROGRESS: 25,
			IN_REVIEW: 0,
			REMARKED: 0,
			APPROVED: 0,
			ACTIVE: 0,
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
