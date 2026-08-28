import type { Logger } from 'pino';
import { apiFetch } from '../../http/fetchClient';
import {
	WebhookUrlListResponseSchema,
	WebhookUrlCreateResponseSchema,
	WebhookUrlUpdateResponseSchema,
	type UpdateWebhookBody
} from './schema';

export const webhookUrlsClient = {
	list: (fetchFn: typeof fetch, logger: Logger, accessToken: string, gatewayToken: string) =>
		apiFetch('/api/v1/management/organizations/webhook-urls', {
			fetch: fetchFn,
			logger,
			accessToken,
			gatewayToken,
			schema: WebhookUrlListResponseSchema
		}),

	create: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		body: { eventType: string; webhookUrl: string; secretKey: string }
	) =>
		apiFetch('/api/v1/management/organizations/webhook-urls', {
			fetch: fetchFn,
			logger,
			method: 'POST',
			accessToken,
			gatewayToken,
			body,
			schema: WebhookUrlCreateResponseSchema
		}),

	update: (
		fetchFn: typeof fetch,
		logger: Logger,
		accessToken: string,
		gatewayToken: string,
		webhookId: number,
		body: UpdateWebhookBody
	) =>
		apiFetch(`/api/v1/management/organizations/webhook-urls/${webhookId}`, {
			fetch: fetchFn,
			logger,
			method: 'PATCH',
			accessToken,
			gatewayToken,
			body,
			schema: WebhookUrlUpdateResponseSchema
		})
};
