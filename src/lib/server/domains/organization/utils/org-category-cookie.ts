import type { Cookies } from '@sveltejs/kit';
import type { OrganizationCategory } from '$lib/data/mockData';
import { parseOrganizationCategory } from '$lib/organization/category';

const COOKIE_NAME = 'org-profile-types';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function readMap(cookies: Cookies): Record<string, OrganizationCategory> {
	const raw = cookies.get(COOKIE_NAME);
	if (!raw) return {};

	try {
		const parsed: unknown = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

		const result: Record<string, OrganizationCategory> = {};
		for (const [orgId, value] of Object.entries(parsed)) {
			const category = parseOrganizationCategory(String(value));
			if (category) result[orgId] = category;
		}
		return result;
	} catch {
		return {};
	}
}

export function readRememberedOrgCategory(
	cookies: Cookies,
	orgId: string
): OrganizationCategory | null {
	return readMap(cookies)[orgId] ?? null;
}

export function rememberOrgCategory(
	cookies: Cookies,
	orgId: string,
	category: OrganizationCategory
): void {
	const next = { ...readMap(cookies), [orgId]: category };
	cookies.set(COOKIE_NAME, JSON.stringify(next), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: MAX_AGE_SECONDS
	});
}
