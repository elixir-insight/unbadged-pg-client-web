import type { OrganizationStatus } from '$lib/data/mockData';
import type {
	MappedOrganizationsTable,
	OrganizationTableRow,
	OrganizationTableStatusCounts
} from '$lib/organization/table';
import type { GetOrganizationsTableResponse, OrganizationTableRecord } from '../../schema';

export type {
	MappedOrganizationsTable,
	OrganizationTableRow,
	OrganizationTableStatusCounts
} from '$lib/organization/table';

const TABLE_STATUSES: OrganizationStatus[] = [
	'IN_PROGRESS',
	'IN_REVIEW',
	'REMARKED',
	'APPROVED',
	'ACTIVE',
	'ON_HOLD',
	'FROZEN',
	'REJECTED'
];

function isTableStatus(value: string): value is OrganizationStatus {
	return TABLE_STATUSES.includes(value as OrganizationStatus);
}

function mapRecord(record: OrganizationTableRecord): OrganizationTableRow {
	return {
		id: record.id,
		name: record.name,
		businessType: record.businessType,
		category: record.category,
		createdAt: record.createdAt,
		status: record.profileStatus as OrganizationStatus
	};
}

/** Resolve display name from table API rows when onboard details only return orgId. */
export function findOrganizationTableName(
	records: OrganizationTableRecord[] | undefined,
	orgId: string
): string | null {
	const name = records?.find((record) => record.id === orgId)?.name?.trim() ?? '';
	if (!name || name === orgId) return null;
	return name;
}

function emptyStatusCounts(): OrganizationTableStatusCounts {
	return {
		all: 0,
		IN_PROGRESS: 0,
		IN_REVIEW: 0,
		REMARKED: 0,
		APPROVED: 0,
		ACTIVE: 0,
		ON_HOLD: 0,
		FROZEN: 0,
		REJECTED: 0
	};
}

function applyStatusCount(
	counts: OrganizationTableStatusCounts,
	status: string,
	count: number
): void {
	if (isTableStatus(status)) {
		counts[status] = count;
	}
}

function readStatusCounts(payload: GetOrganizationsTableResponse): OrganizationTableStatusCounts {
	const counts = emptyStatusCounts();

	const directCounts = payload.statusCounts;
	if (Array.isArray(directCounts)) {
		for (const item of directCounts) {
			applyStatusCount(counts, item.status, item.count);
		}
	} else if (directCounts && typeof directCounts === 'object') {
		for (const status of TABLE_STATUSES) {
			const value = directCounts[status];
			if (typeof value === 'number') {
				counts[status] = value;
			}
		}
		const allValue = directCounts.all ?? directCounts.ALL;
		if (typeof allValue === 'number') {
			counts.all = allValue;
		}
	}

	const nestedCounts = payload.counts;
	if (nestedCounts && typeof nestedCounts === 'object') {
		const nested = nestedCounts as Record<string, unknown>;
		const byStatus = nested.byStatus ?? nested.statusCounts ?? nested.profileStatusCounts;
		if (Array.isArray(byStatus)) {
			for (const item of byStatus) {
				if (
					item &&
					typeof item === 'object' &&
					'status' in item &&
					'count' in item &&
					typeof item.status === 'string' &&
					typeof item.count === 'number'
				) {
					applyStatusCount(counts, item.status, item.count);
				}
			}
		} else if (byStatus && typeof byStatus === 'object') {
			for (const status of TABLE_STATUSES) {
				const value = (byStatus as Record<string, unknown>)[status];
				if (typeof value === 'number') {
					counts[status] = value;
				}
			}
		}
		const allValue = nested.all ?? nested.total;
		if (typeof allValue === 'number') {
			counts.all = allValue;
		}
	}

	if (counts.all === 0) {
		if (Array.isArray(directCounts)) {
			counts.all = directCounts.reduce((sum, item) => sum + item.count, 0);
		} else {
			counts.all = TABLE_STATUSES.reduce((sum, status) => sum + counts[status], 0);
		}
	}

	return counts;
}

export function mapOrganizationsTableResponse(
	payload: GetOrganizationsTableResponse
): MappedOrganizationsTable {
	const organizations = (payload.data ?? []).map(mapRecord);
	const pagination = payload.pagination ?? {
		limit: organizations.length,
		page: organizations.length > 0 ? 1 : 0,
		total: organizations.length
	};
	const statusCounts = readStatusCounts(payload);

	if (statusCounts.all === 0 && pagination.total > 0) {
		statusCounts.all = pagination.total;
	}

	return {
		organizations,
		pagination,
		statusCounts
	};
}
