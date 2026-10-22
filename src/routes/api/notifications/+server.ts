import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { notificationsClient } from '$lib/server/domains/notifications/client';

export const GET: RequestHandler = async ({ url, cookies, locals, fetch }) => {
	const accessToken = cookies.get('accessToken');
	const gatewayToken = locals.gatewayToken;

	if (!accessToken || !gatewayToken) {
		return json({ message: 'Not authenticated' }, { status: 401 });
	}

	const pageParam = url.searchParams.get('page');
	const limitParam = url.searchParams.get('limit');
	const readParam = url.searchParams.get('read');
	const page = pageParam ? Number(pageParam) : undefined;
	const limit = limitParam ? Number(limitParam) : undefined;
	const read = readParam === 'true' ? true : readParam === 'false' ? false : undefined;

	const result = await notificationsClient.list(fetch, locals.logger, accessToken, gatewayToken, {
		page,
		limit,
		read
	});

	if (!result.ok) {
		if (result.error.kind === 'http') {
			return json({ message: result.error.message }, { status: result.error.status });
		}
		if (result.error.kind === 'validation') {
			locals.logger.warn(
				{ issues: result.error.issues },
				'notifications: list response failed schema validation'
			);
			return json({ message: 'Unexpected response shape from backend' }, { status: 502 });
		}
		return json({ message: result.error.message }, { status: 503 });
	}

	return json(result.data);
};
