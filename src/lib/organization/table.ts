import type { OrganizationStatus } from '$lib/data/mockData';

export interface OrganizationTableRow {
	[key: string]: unknown;
	id: string;
	name: string;
	businessType: string;
	category: string;
	createdAt: string;
	status: OrganizationStatus;
}

export interface OrganizationTableStatusCounts {
	all: number;
	IN_PROGRESS: number;
	APPROVED: number;
	ACTIVE: number;
	ON_HOLD: number;
	REJECTED: number;
}

export interface OrganizationTablePagination {
	limit: number;
	page: number;
	total: number;
}

export interface MappedOrganizationsTable {
	organizations: OrganizationTableRow[];
	pagination: OrganizationTablePagination;
	statusCounts: OrganizationTableStatusCounts;
}
