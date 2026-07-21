import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	IpAllowlistResponseSchema,
	CreateIpAllowlistResponseSchema,
	DeleteIpAllowlistResponseSchema,
	type CreateIpAllowlistRequest
} from './schema';

export type IpAllowlistPortal = 'management' | 'merchant';

export function parseIpAllowlistPortal(value: string | null): IpAllowlistPortal | null {
	if (value === 'management' || value === 'merchant') return value;
	return null;
}

function collectionPath(portal: IpAllowlistPortal, orgId: string): string {
	return `/api/v1/${portal}/organizations/${encodeURIComponent(orgId)}/ip-allowlists`;
}

function entryPath(portal: IpAllowlistPortal, orgId: string, id: number): string {
	return `/api/v1/${portal}/organizations/${encodeURIComponent(orgId)}/ip-allowlists/${id}`;
}

export const ipAllowlistClient = {
	list: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		portal: IpAllowlistPortal,
		orgId: string
	) =>
		apiFetch(collectionPath(portal, orgId), {
			fetch: fetchFn,
			logger,
			method: 'GET',
			accessToken,
			gatewayToken,
			schema: IpAllowlistResponseSchema
		}),

	create: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		body: CreateIpAllowlistRequest,
		portal: IpAllowlistPortal,
		orgId: string
	) =>
		apiFetch(collectionPath(portal, orgId), {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body,
			schema: CreateIpAllowlistResponseSchema
		}),

	remove: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		id: number,
		portal: IpAllowlistPortal,
		orgId: string
	) =>
		apiFetch(entryPath(portal, orgId, id), {
			fetch: fetchFn,
			logger,
			method: 'DELETE',
			accessToken,
			gatewayToken,
			schema: DeleteIpAllowlistResponseSchema
		})
};
