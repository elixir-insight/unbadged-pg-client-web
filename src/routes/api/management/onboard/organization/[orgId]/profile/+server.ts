import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getValidSession, SessionError } from '$lib/server/domains/auth/getValidSession';
import { requirePortalAccess } from '$lib/server/domains/auth/requirePortalAccess';
import { organizationClient } from '$lib/server/domains/organization/client';

export const GET: RequestHandler = async ({ params, cookies, fetch, locals }) => {
	const orgId = params.orgId?.trim();
	if (!orgId) {
		error(400, { message: 'Organization id is required' });
	}

	const log = locals.logger.child({ action: 'get-organization-profile', orgId });

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (cause) {
		if (cause instanceof SessionError) {
			error(401, { message: 'Unauthorized' });
		}
		throw cause;
	}

	if (!locals.merchantSession) {
		error(401, { message: 'Unauthorized' });
	}
	requirePortalAccess('/management', locals.merchantSession);

	const result = await organizationClient.getProfile(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId
	);

	if (!result.ok) {
		log.warn(
			{ kind: result.error.kind, message: result.error.message },
			'organization profile fetch failed'
		);
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	const profile = result.data.data[0];
	if (!profile) {
		error(404, { message: 'Organization profile not found' });
	}

	return json({ profile });
};
