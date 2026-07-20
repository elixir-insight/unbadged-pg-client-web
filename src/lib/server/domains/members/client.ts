import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	CreateMemberResponseSchema,
	CreateOrgRoleResponseSchema,
	DeleteMemberResponseSchema,
	DeleteOrgRoleResponseSchema,
	MemberDetailResponseSchema,
	MembersListResponseSchema,
	OrgRoleDetailResponseSchema,
	OrgRolesListResponseSchema,
	PermissionsCatalogResponseSchema,
	UpdateMemberResponseSchema,
	UpdateOrgRoleResponseSchema,
	UserDirectoryListResponseSchema,
	type CreateMemberBody,
	type CreateOrgRoleBody,
	type UpdateMemberBody,
	type UpdateOrgRoleBody
} from './schema';
import { type MembersApiPortal, membersBasePath } from './portal';

export type MembersListQuery = {
	page?: number;
	limit?: number;
};

export type OrgRolesListQuery = {
	page?: number;
	limit?: number;
};

export const membersClient = {
	list: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		query: MembersListQuery = {},
		portal: MembersApiPortal = 'management'
	) =>
		apiFetch(`${membersBasePath(portal)}/member`, {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'GET',
			query: {
				page: query.page,
				limit: query.limit
			},
			schema: MembersListResponseSchema
		}),

	getById: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		memberId: number,
		portal: MembersApiPortal = 'management'
	) =>
		apiFetch(`${membersBasePath(portal)}/member/${memberId}`, {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'GET',
			schema: MemberDetailResponseSchema
		}),

	listOrgRoles: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: number,
		query: OrgRolesListQuery = {},
		portal: MembersApiPortal = 'management'
	) =>
		apiFetch(`${membersBasePath(portal)}/organizations/${orgId}/roles`, {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'GET',
			query: {
				page: query.page,
				limit: query.limit
			},
			schema: OrgRolesListResponseSchema
		}),

	/** GET /api/v1/{portal}/organizations/{orgId}/roles/{roleId} */
	getOrgRole: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: number,
		roleId: number,
		portal: MembersApiPortal = 'management'
	) =>
		apiFetch(`${membersBasePath(portal)}/organizations/${orgId}/roles/${roleId}`, {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'GET',
			schema: OrgRoleDetailResponseSchema
		}),

	/** POST /api/v1/{portal}/organizations/{orgId}/roles */
	createOrgRole: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: number,
		body: CreateOrgRoleBody,
		portal: MembersApiPortal = 'management'
	) =>
		apiFetch(`${membersBasePath(portal)}/organizations/${orgId}/roles`, {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'POST',
			body,
			schema: CreateOrgRoleResponseSchema
		}),

	/** PATCH /api/v1/{portal}/organizations/{orgId}/roles/{roleId} */
	updateOrgRole: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: number,
		roleId: number,
		body: UpdateOrgRoleBody,
		portal: MembersApiPortal = 'management'
	) =>
		apiFetch(`${membersBasePath(portal)}/organizations/${orgId}/roles/${roleId}`, {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'PATCH',
			body,
			schema: UpdateOrgRoleResponseSchema
		}),

	/** DELETE /api/v1/{portal}/organizations/{orgId}/roles/{roleId} */
	deleteOrgRole: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		orgId: number,
		roleId: number,
		portal: MembersApiPortal = 'management'
	) =>
		apiFetch(`${membersBasePath(portal)}/organizations/${orgId}/roles/${roleId}`, {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'DELETE',
			schema: DeleteOrgRoleResponseSchema
		}),

	listUsers: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		query: OrgRolesListQuery = {},
		portal: MembersApiPortal = 'management'
	) =>
		apiFetch(`${membersBasePath(portal)}/user/list`, {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'GET',
			query: {
				page: query.page ?? 0,
				limit: query.limit ?? 1000
			},
			schema: UserDirectoryListResponseSchema
		}),

	/** GET /api/v1/{portal}/permissions — RBAC permission catalog for role management */
	listPermissions: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		portal: MembersApiPortal = 'management'
	) =>
		apiFetch(`${membersBasePath(portal)}/permissions`, {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'GET',
			schema: PermissionsCatalogResponseSchema
		}),

	create: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		body: CreateMemberBody,
		portal: MembersApiPortal = 'management'
	) =>
		apiFetch(`${membersBasePath(portal)}/member`, {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'POST',
			body,
			schema: CreateMemberResponseSchema
		}),

	update: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		memberId: number,
		body: UpdateMemberBody,
		portal: MembersApiPortal = 'management'
	) =>
		apiFetch(`${membersBasePath(portal)}/member/${memberId}`, {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'PUT',
			body,
			schema: UpdateMemberResponseSchema
		}),

	delete: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		memberId: number,
		portal: MembersApiPortal = 'management'
	) =>
		apiFetch(`${membersBasePath(portal)}/member/${memberId}`, {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'DELETE',
			schema: DeleteMemberResponseSchema
		})
};
