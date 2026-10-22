import type { Cookies } from '@sveltejs/kit';

const COOKIE_NAME = 'org-brand-names';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function readMap(cookies: Cookies): Record<string, string> {
	const raw = cookies.get(COOKIE_NAME);
	if (!raw) return {};

	try {
		const parsed: unknown = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

		const result: Record<string, string> = {};
		for (const [orgId, value] of Object.entries(parsed)) {
			const brandName = String(value ?? '').trim();
			if (brandName) result[orgId] = brandName;
		}
		return result;
	} catch {
		return {};
	}
}

export function readRememberedOrgBrandName(cookies: Cookies, orgId: string): string {
	return readMap(cookies)[orgId] ?? '';
}

export function rememberOrgBrandName(cookies: Cookies, orgId: string, brandName: string): void {
	const trimmed = brandName.trim();
	const current = readMap(cookies);
	if (!trimmed) {
		if (!(orgId in current)) return;
		const rest = { ...current };
		delete rest[orgId];
		cookies.set(COOKIE_NAME, JSON.stringify(rest), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: MAX_AGE_SECONDS
		});
		return;
	}

	cookies.set(COOKIE_NAME, JSON.stringify({ ...current, [orgId]: trimmed }), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: MAX_AGE_SECONDS
	});
}
