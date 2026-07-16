import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { organizationClient } from '$lib/server/domains/organization/client';
import {
	buildUpdateOrganizationKybRequest,
	UpdateOrganizationFormBodySchema
} from '$lib/server/domains/organization/map-update-request';

export const PUT: RequestHandler = async ({ params, request, cookies, fetch, locals }) => {
	const log = locals.logger;
	const orgId = params.orgId?.trim();

	if (!orgId) {
		error(400, 'Organization id is required');
	}

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			error(401, e.message);
		}
		throw e;
	}

	const body = await request.json().catch(() => null);
	const parsed = v.safeParse(UpdateOrganizationFormBodySchema, body);

	if (!parsed.success) {
		log.warn({ issues: parsed.issues }, 'update organization rejected — invalid request body');
		error(400, parsed.issues[0]?.message ?? 'Invalid organization payload');
	}

	let upstreamBody;
	try {
		upstreamBody = buildUpdateOrganizationKybRequest(parsed.output);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Invalid organization payload';
		log.warn({ message }, 'update organization rejected — mapping failed');
		error(400, message);
	}

	const result = await organizationClient.update(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId,
		upstreamBody
	);

	if (!result.ok) {
		const status = result.error.kind === 'http' ? result.error.status : 502;
		return json(
			{
				message: result.error.message,
				exceptionCode: result.error.kind === 'http' ? result.error.code : undefined,
				statusCode: status
			},
			{ status }
		);
	}

	return json({
		message: result.data.message ?? 'Organization updated successfully',
		statusCode: result.data.statusCode ?? 200
	});
};
