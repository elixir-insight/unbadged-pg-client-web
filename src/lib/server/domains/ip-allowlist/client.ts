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

function collectionPath(portal: IpAllowlistPortal): string {
	return `/api/v1/${portal}/organizations/ip-allowlists/`;
}

function entryPath(portal: IpAllowlistPortal, id: number): string {
	return `/api/v1/${portal}/organizations/ip-allowlists/${id}`;
}

export const ipAllowlistClient = {
	list: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		portal: IpAllowlistPortal
	) =>
		apiFetch(collectionPath(portal), {
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
		portal: IpAllowlistPortal
	) =>
		apiFetch(collectionPath(portal), {
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
		portal: IpAllowlistPortal
	) =>
		apiFetch(entryPath(portal, id), {
			fetch: fetchFn,
			logger,
			method: 'DELETE',
			accessToken,
			gatewayToken,
			schema: DeleteIpAllowlistResponseSchema
		})
};
