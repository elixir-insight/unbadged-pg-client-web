function toId(value: unknown): number | undefined {
	const id = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
	return typeof id === 'number' && Number.isInteger(id) ? id : undefined;
}

function idsFromDirectorList(list: unknown, expected: number): number[] | null {
	if (!Array.isArray(list) || list.length !== expected) return null;
	const ids = list.map((item) =>
		item && typeof item === 'object' ? toId((item as { id?: unknown }).id) : undefined
	);
	return ids.every((id): id is number => id !== undefined) ? ids : null;
}

/**
 * Pulls director ids out of an organization response's `data` array. The payload
 * is either the director list itself or a single org record carrying `directors`.
 * Ids are matched to the local list by position, so this only returns ids when
 * the counts line up; otherwise null.
 */
export function extractDirectorIds(data: unknown, expected: number): number[] | null {
	if (!Array.isArray(data)) return null;
	const direct = idsFromDirectorList(data, expected);
	if (direct) return direct;
	const org = data[0];
	if (org && typeof org === 'object') {
		return idsFromDirectorList((org as { directors?: unknown }).directors, expected);
	}
	return null;
}
