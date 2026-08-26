import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import type { Actions, PageServerLoad } from './$types';
import { partnerWebhookUrlsClient } from '$lib/server/domains/partner-webhook-urls/client';
import {
	AddWebhookBodySchema,
	UpdateWebhookBodySchema,
	type UpdateWebhookBody
} from '$lib/server/domains/webhook-urls/schema';
import { getValidSession } from '$lib/server/domains/auth/getValidSession';
import { resetPasswordAction } from '$lib/server/domains/auth/reset-password';
import { clearAuthCookies } from '$lib/server/domains/auth/session';
import { isPlatformPortal } from '$lib/stores/auth/portal';

export const load: PageServerLoad = async ({ cookies, fetch, locals }) => {
	const isPlatform = isPlatformPortal(locals.merchantSession?.groups);

	if (!isPlatform) {
		return {
			isPlatform: false,
			webhookUrls: [],
			webhookUrlsError: null
		};
	}

	const tokens = await getValidSession(cookies, fetch, locals.logger);
	const webhookResult = await partnerWebhookUrlsClient.list(
		fetch,
		locals.logger,
		tokens.accessToken,
		tokens.gatewayToken
	);

	if (
		!webhookResult.ok &&
		webhookResult.error.kind === 'http' &&
		webhookResult.error.status === 401
	) {
		clearAuthCookies(cookies);
		redirect(303, '/login?reason=session-expired');
	}

	let webhookUrls: {
		id: string;
		eventType: string;
		webhookUrl: string;
		isActive: boolean;
		createdAt: string;
	}[] = [];
	let webhookUrlsError: string | null = null;

	if (!webhookResult.ok) {
		locals.logger.error({ error: webhookResult.error }, 'failed to load webhook URLs');
		webhookUrlsError = 'Could not load your webhook URLs. Please try again.';
	} else {
		webhookUrls = webhookResult.data.data.map((item) => ({
			id: String(item.id),
			eventType: item.eventType,
			webhookUrl: item.webhookUrl,
			isActive: item.isActive,
			createdAt: item.createdAt
		}));
	}

	return {
		isPlatform: true,
		webhookUrls,
		webhookUrlsError
	};
};

export const actions = {
	addWebhook: async ({ request, cookies, fetch, locals }) => {
		if (!isPlatformPortal(locals.merchantSession?.groups)) {
			return fail(403, {
				message: 'Webhook configuration is only available for Platform accounts.'
			});
		}

		const formData = await request.formData();
		const raw = {
			eventType: String(formData.get('eventType') ?? ''),
			webhookUrl: String(formData.get('webhookUrl') ?? ''),
			secretKey: String(formData.get('secretKey') ?? '')
		};

		const parsed = v.safeParse(AddWebhookBodySchema, raw);
		if (!parsed.success) {
			return fail(400, { message: parsed.issues[0]?.message ?? 'Invalid request.' });
		}

		const tokens = await getValidSession(cookies, fetch, locals.logger);
		const result = await partnerWebhookUrlsClient.create(
			fetch,
			locals.logger,
			tokens.accessToken,
			tokens.gatewayToken,
			parsed.output
		);

		if (result.ok) {
			return { added: true };
		}

		if (result.error.kind === 'http' && result.error.status === 401) {
			clearAuthCookies(cookies);
			redirect(303, '/login?reason=session-expired');
		}
		if (result.error.kind === 'http' && result.error.status === 400) {
			return fail(400, { message: result.error.message || 'Invalid request.' });
		}
		locals.logger.error({ error: result.error }, 'failed to add webhook URL');
		return fail(500, { message: 'Something went wrong. Please try again.', retryable: true });
	},

	editWebhook: async ({ request, cookies, fetch, locals }) => {
		if (!isPlatformPortal(locals.merchantSession?.groups)) {
			return fail(403, {
				message: 'Webhook configuration is only available for Platform accounts.'
			});
		}

		const formData = await request.formData();
		const webhookId = Number(formData.get('webhookId'));
		if (!Number.isInteger(webhookId) || webhookId <= 0) {
			return fail(400, { message: 'Invalid webhook id.' });
		}

		const raw: UpdateWebhookBody = {};
		if (formData.has('eventType')) {
			raw.eventType = String(formData.get('eventType') ?? '');
		}
		if (formData.has('webhookUrl')) {
			raw.webhookUrl = String(formData.get('webhookUrl') ?? '');
		}
		if (formData.has('isActive')) {
			const isActive = formData.get('isActive');
			if (isActive !== 'true' && isActive !== 'false') {
				return fail(400, { message: 'Invalid webhook status.' });
			}
			raw.isActive = isActive === 'true';
		}
		if (formData.has('secretKey')) {
			const secretKey = String(formData.get('secretKey') ?? '');
			if (secretKey.length > 0) {
				raw.secretKey = secretKey;
			}
		}

		const parsed = v.safeParse(UpdateWebhookBodySchema, raw);
		if (!parsed.success) {
			return fail(400, { message: parsed.issues[0]?.message ?? 'Invalid request.' });
		}

		const tokens = await getValidSession(cookies, fetch, locals.logger);
		const result = await partnerWebhookUrlsClient.update(
			fetch,
			locals.logger,
			tokens.accessToken,
			tokens.gatewayToken,
			webhookId,
			parsed.output
		);

		if (result.ok) {
			return { updated: true };
		}

		if (result.error.kind === 'http' && result.error.status === 401) {
			clearAuthCookies(cookies);
			redirect(303, '/login?reason=session-expired');
		}

		const status = result.error.kind === 'http' ? result.error.status : 500;
		const backendMessage = result.error.message || 'Something went wrong. Please try again.';
		if (status === 400 || status === 409) {
			return fail(status, { message: backendMessage });
		}
		if (status === 403) {
			return fail(403, {
				message: 'You do not have permission to update this webhook.'
			});
		}

		locals.logger.error({ kind: result.error.kind, status }, 'failed to update webhook URL');
		return fail(500, {
			message: 'Something went wrong. Please try again.',
			retryable: true
		});
	},

	resetPassword: async ({ request, cookies, fetch, locals }) =>
		resetPasswordAction({
			request,
			cookies,
			fetch,
			logger: locals.logger
		})
} satisfies Actions;
