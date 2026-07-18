import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	CreateMemberResponseSchema,
	DeleteMemberResponseSchema,
	MemberDetailResponseSchema,
	MembersListResponseSchema,
	OrgRolesListResponseSchema,
	UpdateMemberResponseSchema,
	UserDirectoryListResponseSchema,
	type CreateMemberBody,
	type UpdateMemberBody
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
