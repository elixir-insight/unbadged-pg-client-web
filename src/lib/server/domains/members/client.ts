import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	CreateMemberResponseSchema,
	MemberDetailResponseSchema,
	MembersListResponseSchema,
	OrgRolesListResponseSchema,
	UserDirectoryListResponseSchema,
	type CreateMemberBody
} from './schema';

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
		query: MembersListQuery = {}
	) =>
		apiFetch('/api/v1/management/member', {
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
		memberId: number
	) =>
		apiFetch(`/api/v1/management/member/${memberId}`, {
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
		query: OrgRolesListQuery = {}
	) =>
		apiFetch(`/api/v1/management/organizations/${orgId}/roles`, {
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
		query: OrgRolesListQuery = {}
	) =>
		apiFetch('/api/v1/management/user/list', {
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
		body: CreateMemberBody
	) =>
		apiFetch('/api/v1/management/member', {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'POST',
			body,
			schema: CreateMemberResponseSchema
		})
};
