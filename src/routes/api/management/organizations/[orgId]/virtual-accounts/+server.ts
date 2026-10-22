import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getValidSession, SessionError } from '$lib/server/domains/auth/getValidSession';
import { requirePortalAccess } from '$lib/server/domains/auth/requirePortalAccess';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { virtualAccountClient } from '$lib/server/domains/virtual-account/client';

export const GET: RequestHandler = async ({ params, cookies, fetch, locals }) => {
	requirePermission(locals.userPermissions, 'ORGANIZATION', 'read');
	const orgId = params.orgId?.trim();
	if (!orgId) {
		error(400, { message: 'Organization id is required' });
	}

	const log = locals.logger.child({ action: 'get-organization-virtual-accounts', orgId });

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

	const result = await virtualAccountClient.listByOrganization(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId
	);

	if (!result.ok) {
		log.warn(
			{ kind: result.error.kind, message: result.error.message },
			'organization virtual accounts fetch failed'
		);
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	const virtualAccounts = result.data.data.flatMap((account) => {
		const vanNumber = account.virtualAccountNumber.trim();
		if (!vanNumber) return [];

		return [
			{
				vanNumber,
				pipelineRole: account.pipelineRole?.trim() || '—',
				status: account.status?.trim() || '—'
			}
		];
	});

	return json({ virtualAccounts });
};
