import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { organizationClient } from '$lib/server/domains/organization/client';
import { extractOrganizationId } from '$lib/server/domains/organization/extract-id';
import {
	buildCreateOrganizationRequest,
	CreateOrganizationFormBodySchema
} from '$lib/server/domains/organization/map-request';

export const POST: RequestHandler = async ({ request, cookies, fetch, locals }) => {
	const log = locals.logger;

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
	const parsed = v.safeParse(CreateOrganizationFormBodySchema, body);

	if (!parsed.success) {
		log.warn({ issues: parsed.issues }, 'create organization rejected — invalid request body');
		error(400, parsed.issues[0]?.message ?? 'Invalid organization payload');
	}

	let upstreamBody;
	try {
		upstreamBody = buildCreateOrganizationRequest(parsed.output);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Invalid organization payload';
		log.warn({ message }, 'create organization rejected — mapping failed');
		error(400, message);
	}

	const result = await organizationClient.create(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
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

	const organizationId = extractOrganizationId(result.data);
	if (!organizationId) {
		log.warn({ upstream: result.data }, 'create organization succeeded without orgId');
		return json(
			{
				message: 'Organization created but no orgId was returned',
				statusCode: 502
			},
			{ status: 502 }
		);
	}

	return json({
		message: result.data.message ?? 'Organization created successfully',
		organizationId,
		statusCode: result.data.statusCode ?? 201
	});
};
