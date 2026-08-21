import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	GetNotificationModulesResponseSchema,
	GetNotificationSubscriptionsResponseSchema,
	ListNotificationsResponseSchema,
	UpdateNotificationStateResponseSchema,
	UpdateNotificationSubscriptionsResponseSchema,
	type UpdateNotificationStateRequest,
	type UpdateNotificationSubscriptionsRequest
} from './schema';
import { type NotificationsApiPortal, notificationsBasePath } from './portal';

export type ListNotificationsQuery = {
	page?: number;
	limit?: number;
	read?: boolean;
};

export const notificationsClient = {
	/** GET /api/v1/{portal}/notification-modules */
	getModules: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		portal: NotificationsApiPortal
	) =>
		apiFetch(`${notificationsBasePath(portal)}/notification-modules`, {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'GET',
			schema: GetNotificationModulesResponseSchema
		}),

	/** GET /api/v1/user/notifications */
	list: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		query: ListNotificationsQuery = {}
	) =>
		apiFetch('/api/v1/user/notifications', {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'GET',
			query: {
				page: query.page,
				limit: query.limit,
				read: query.read === undefined ? undefined : String(query.read)
			},
			schema: ListNotificationsResponseSchema
		}),

	/** PATCH /api/v1/user/notifications/{notificationId} */
	updateState: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		notificationId: number,
		body: UpdateNotificationStateRequest
	) =>
		apiFetch(`/api/v1/user/notifications/${notificationId}`, {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'PATCH',
			body,
			schema: UpdateNotificationStateResponseSchema
		}),

	/** GET /api/v1/user/notifications/subscriptions */
	getSubscriptions: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string
	) =>
		apiFetch('/api/v1/user/notifications/subscriptions', {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'GET',
			schema: GetNotificationSubscriptionsResponseSchema
		}),

	/** PATCH /api/v1/user/notifications/subscriptions */
	updateSubscriptions: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		body: UpdateNotificationSubscriptionsRequest
	) =>
		apiFetch('/api/v1/user/notifications/subscriptions', {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			method: 'PATCH',
			body,
			schema: UpdateNotificationSubscriptionsResponseSchema
		})
};
