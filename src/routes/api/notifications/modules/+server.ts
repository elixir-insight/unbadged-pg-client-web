import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { notificationsClient } from '$lib/server/domains/notifications/client';
import { parseNotificationsPortal } from '$lib/server/domains/notifications/portal';

export const GET: RequestHandler = async ({ url, cookies, locals, fetch }) => {
	const accessToken = cookies.get('accessToken');
	const gatewayToken = locals.gatewayToken;

	if (!accessToken || !gatewayToken) {
		return json({ message: 'Not authenticated' }, { status: 401 });
	}

	const portal = parseNotificationsPortal(url.searchParams.get('portal'));
	if (!portal) {
		return json({ message: 'Invalid portal' }, { status: 400 });
	}

	const result = await notificationsClient.getModules(
		fetch,
		locals.logger,
		accessToken,
		gatewayToken,
		portal
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			return json({ message: result.error.message }, { status: result.error.status });
		}
		if (result.error.kind === 'validation') {
			locals.logger.warn(
				{ issues: result.error.issues },
				'notifications: modules response failed schema validation'
			);
			return json({ message: 'Unexpected response shape from backend' }, { status: 502 });
		}
		return json({ message: result.error.message }, { status: 503 });
	}

	return json(result.data);
};
