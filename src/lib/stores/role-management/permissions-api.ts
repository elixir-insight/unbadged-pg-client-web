import { browser } from '$app/environment';
import {
	mapPermissionsCatalog,
	type ApiPermissionModule,
	type PermissionsCatalog
} from './permissions-mapper';

export type PermissionsApiPortal = 'management' | 'merchant';

function resolvePortal(portal?: PermissionsApiPortal): PermissionsApiPortal {
	if (portal) return portal;
	if (browser && window.location.pathname.startsWith('/merchant')) return 'merchant';
	if (browser && window.location.pathname.startsWith('/management')) return 'management';
	return 'management';
}

function withPortal(path: string, portal?: PermissionsApiPortal): string {
	const resolved = resolvePortal(portal);
	const sep = path.includes('?') ? '&' : '?';
	return `${path}${sep}portal=${resolved}`;
}

type PermissionsApiResponse = {
	modules: ApiPermissionModule[];
	message: string;
	statusCode: number;
};

/** Fetch RBAC permission catalog via BFF (`GET /api/roles/permissions`). */
export async function fetchPermissionsCatalog(
	portal?: PermissionsApiPortal
): Promise<PermissionsCatalog> {
	const res = await fetch(withPortal('/api/roles/permissions', portal));
	if (!res.ok) throw new Error('Failed to fetch permissions');

	const raw: PermissionsApiResponse = await res.json();
	return mapPermissionsCatalog(raw?.modules ?? []);
}
