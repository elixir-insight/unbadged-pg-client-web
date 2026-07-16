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
	AddBankFormBodySchema,
	buildUpdateOrganizationBankRequest
} from '$lib/server/domains/organization/map-bank-request';

export const PUT: RequestHandler = async ({ params, request, cookies, fetch, locals }) => {
	const log = locals.logger;
	const orgId = params.orgId?.trim();
	const accountId = params.accountId?.trim();

	if (!orgId) {
		error(400, 'Organization id is required');
	}
	if (!accountId) {
		error(400, 'Bank account id is required');
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
	const parsed = v.safeParse(AddBankFormBodySchema, body);

	if (!parsed.success) {
		log.warn({ issues: parsed.issues }, 'update bank rejected — invalid request body');
		error(400, parsed.issues[0]?.message ?? 'Invalid bank account payload');
	}

	let upstreamBody;
	try {
		upstreamBody = buildUpdateOrganizationBankRequest(parsed.output);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Invalid bank account payload';
		log.warn({ message }, 'update bank rejected — mapping failed');
		error(400, message);
	}

	const result = await organizationClient.updateBank(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId,
		accountId,
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
		message: result.data.message ?? 'Bank account updated successfully',
		statusCode: result.data.statusCode ?? 200
	});
};
