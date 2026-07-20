import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ipAllowlistClient } from '$lib/server/domains/ip-allowlist/client';

export const DELETE: RequestHandler = async ({ params, cookies, locals, fetch }) => {
	const accessToken = cookies.get('accessToken');
	const gatewayToken = locals.gatewayToken;

	if (!accessToken || !gatewayToken) {
		return json({ message: 'Not authenticated' }, { status: 401 });
	}

	const id = Number(params.id);
	if (!Number.isFinite(id)) {
		return json({ message: 'Invalid IP allowlist id' }, { status: 400 });
	}

	const result = await ipAllowlistClient.remove(
		fetch,
		locals.logger,
		accessToken,
		gatewayToken,
		id
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			return json({ message: result.error.message }, { status: result.error.status });
		}
		if (result.error.kind === 'validation') {
			locals.logger.warn(
				{ issues: result.error.issues },
				'ip-allowlist: delete response failed schema validation'
			);
			return json({ message: 'Unexpected response shape from backend' }, { status: 502 });
		}
		return json({ message: result.error.message }, { status: 503 });
	}

	return json(result.data);
};
