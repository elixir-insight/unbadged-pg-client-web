import type { CreateOrganizationResponse } from './schema';

type CreatedOrgData = {
	orgId?: string;
	organizationId?: string;
	id?: string;
};

function readOrgIdFromRecord(data: CreatedOrgData): string | null {
	const candidates = [data.orgId, data.organizationId, data.id];
	for (const candidate of candidates) {
		if (typeof candidate === 'string' && candidate.trim()) {
			return candidate.trim();
		}
	}
	return null;
}

export function extractOrganizationId(response: CreateOrganizationResponse): string | null {
	const data = response.data;
	if (typeof data === 'string' && data.trim()) return data.trim();
	if (Array.isArray(data)) {
		const first = data[0];
		return first ? readOrgIdFromRecord(first) : null;
	}
	if (data && typeof data === 'object') {
		return readOrgIdFromRecord(data);
	}
	return null;
}
