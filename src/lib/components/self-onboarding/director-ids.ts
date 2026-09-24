import type { Director } from '$lib/types/onboarding';

type LocalDirector = Pick<Director, 'id' | 'pan' | 'email'>;
type UpstreamDirector = { id: number; pan: string; email: string };

function toId(value: unknown): number | undefined {
	const id = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
	return typeof id === 'number' && Number.isInteger(id) ? id : undefined;
}

function text(value: unknown): string {
	return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function upstreamDirectors(list: unknown): UpstreamDirector[] | null {
	if (!Array.isArray(list)) return null;
	const directors: UpstreamDirector[] = [];
	for (const item of list) {
		if (!item || typeof item !== 'object') return null;
		const record = item as { id?: unknown; pan?: unknown; email?: unknown };
		const id = toId(record.id);
		if (id === undefined) return null;
		directors.push({ id, pan: text(record.pan), email: text(record.email) });
	}
	return directors;
}

/**
 * Pulls director ids out of an organization response's `data` array. The payload is either the
 * director list itself or a single org record carrying `directors`.
 *
 * Each local director is matched to its upstream record by PAN, then email — the upstream list
 * can hold directors this form doesn't (e.g. saved in an earlier attempt), so position alone
 * isn't reliable. Position is only the fallback when the counts line up exactly. Returns null
 * unless every local director gets an id.
 */
export function extractDirectorIds(data: unknown, local: LocalDirector[]): number[] | null {
	if (!Array.isArray(data) || local.length === 0) return null;
	const org = data[0];
	const upstream =
		upstreamDirectors(
			data.length > 0 && org && typeof org === 'object' && 'directors' in org
				? (org as { directors?: unknown }).directors
				: data
		) ?? [];
	if (upstream.length === 0) return null;

	const used = new Set<number>();
	const claim = (match: UpstreamDirector | undefined) => {
		if (!match || used.has(match.id)) return undefined;
		used.add(match.id);
		return match.id;
	};

	const ids = local.map((director) => {
		const pan = text(director.pan);
		const email = text(director.email);
		return (
			claim(upstream.find((u) => u.id === director.id)) ??
			claim(upstream.find((u) => !used.has(u.id) && pan !== '' && u.pan === pan)) ??
			claim(upstream.find((u) => !used.has(u.id) && email !== '' && u.email === email))
		);
	});
	if (ids.every((id): id is number => id !== undefined)) return ids;

	if (upstream.length === local.length) return upstream.map((u) => u.id);
	return null;
}
