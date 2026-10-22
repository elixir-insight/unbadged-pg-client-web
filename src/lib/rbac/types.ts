/**
 * Shared RBAC types — isomorphic (used by both server guards and client UI).
 *
 * The module/action vocabulary mirrors the upstream permission catalog
 * (`GET /api/v1/{portal}/permissions`), as literal unions so `can()` calls
 * are typo-checked at compile time.
 */

/** Module ids, matching the upstream permission catalog's `module` field. */
export type RbacModule =
	| 'ORGANIZATION'
	| 'PAYINS'
	| 'PAYOUTS'
	| 'PROFILE'
	| 'REPORTS'
	| 'ROLE_MANAGEMENT'
	| 'USER_MANAGEMENT';

/** Action names, matching the upstream permission catalog's `name` field. */
export type RbacAction = 'read' | 'write' | 'write-restricted' | 'delete' | 'approve';

/** Normalized per-user permission grants: module → set of granted actions. */
export type RbacPermissions = Partial<Record<RbacModule, Set<RbacAction>>>;

/**
 * Raw shape of `GET /api/v1/user/permissions`:
 * `data: [{ [portalGroup: string]: { [module: string]: string[] } }]`
 * e.g. `data: [{ MANAGEMENT: { PAYOUTS: ["read", "write"] } }]`
 */
export type RawUserPermissionsEntry = Record<string, Record<string, string[]>>;
