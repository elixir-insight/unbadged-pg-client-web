import { json } from '@sveltejs/kit';
import * as v from 'valibot';
import type { RequestHandler } from './$types';
import { notificationsClient } from '$lib/server/domains/notifications/client';
import { UpdateNotificationStateRequestSchema } from '$lib/server/domains/notifications/schema';

export const PATCH: RequestHandler = async ({ params, request, cookies, locals, fetch }) => {
	const accessToken = cookies.get('accessToken');
	const gatewayToken = locals.gatewayToken;

	if (!accessToken || !gatewayToken) {
		return json({ message: 'Not authenticated' }, { status: 401 });
	}

	const notificationId = Number(params.notificationId);
	if (!Number.isFinite(notificationId)) {
		return json({ message: 'Invalid notification id' }, { status: 400 });
	}

	const rawBody: unknown = await request.json().catch(() => null);
	const parsedBody = v.safeParse(UpdateNotificationStateRequestSchema, rawBody);
	if (!parsedBody.success) {
		return json({ message: 'A valid action is required' }, { status: 400 });
	}

	const result = await notificationsClient.updateState(
		fetch,
		locals.logger,
		accessToken,
		gatewayToken,
		notificationId,
		parsedBody.output
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			return json({ message: result.error.message }, { status: result.error.status });
		}
		if (result.error.kind === 'validation') {
			locals.logger.warn(
				{ issues: result.error.issues },
				'notifications: update state response failed schema validation'
			);
			return json({ message: 'Unexpected response shape from backend' }, { status: 502 });
		}
		return json({ message: result.error.message }, { status: 503 });
	}

	return json(result.data);
};
