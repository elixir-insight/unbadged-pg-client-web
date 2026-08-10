import { json } from '@sveltejs/kit';
import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { notificationsClient } from '$lib/server/domains/notifications/client';
import { UpdateNotificationSubscriptionsRequestSchema } from '$lib/server/domains/notifications/schema';

export const GET: RequestHandler = async ({ cookies, locals, fetch }) => {
	const accessToken = cookies.get('accessToken');
	const gatewayToken = locals.gatewayToken;

	if (!accessToken || !gatewayToken) {
		return json({ message: 'Not authenticated' }, { status: 401 });
	}

	const result = await notificationsClient.getSubscriptions(
		fetch,
		locals.logger,
		accessToken,
		gatewayToken
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			return json({ message: result.error.message }, { status: result.error.status });
		}
		if (result.error.kind === 'validation') {
			locals.logger.warn(
				{ issues: result.error.issues },
				'notifications: subscriptions response failed schema validation'
			);
			return json({ message: 'Unexpected response shape from backend' }, { status: 502 });
		}
		return json({ message: result.error.message }, { status: 503 });
	}

	return json(result.data);
};

export const PATCH: RequestHandler = async ({ request, cookies, locals, fetch }) => {
	const accessToken = cookies.get('accessToken');
	const gatewayToken = locals.gatewayToken;

	if (!accessToken || !gatewayToken) {
		return json({ message: 'Not authenticated' }, { status: 401 });
	}

	const rawBody: unknown = await request.json().catch(() => null);
	const parsedBody = v.safeParse(UpdateNotificationSubscriptionsRequestSchema, rawBody);
	if (!parsedBody.success) {
		return json({ message: 'A valid list of subscriptions is required' }, { status: 400 });
	}

	const result = await notificationsClient.updateSubscriptions(
		fetch,
		locals.logger,
		accessToken,
		gatewayToken,
		parsedBody.output
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			return json({ message: result.error.message }, { status: result.error.status });
		}
		if (result.error.kind === 'validation') {
			locals.logger.warn(
				{ issues: result.error.issues },
				'notifications: update subscriptions response failed schema validation'
			);
			return json({ message: 'Unexpected response shape from backend' }, { status: 502 });
		}
		return json({ message: result.error.message }, { status: 503 });
	}

	return json(result.data);
};
