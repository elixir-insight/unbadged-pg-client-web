import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { organizationClient } from '$lib/server/domains/organization/client';
import { extractBankAccountId } from '$lib/server/domains/organization/extract-bank-id';
import {
	AddBankFormBodySchema,
	buildAddOrganizationBankRequest
} from '$lib/server/domains/organization/map-bank-request';

export const POST: RequestHandler = async ({ params, request, cookies, fetch, locals }) => {
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
	const parsed = v.safeParse(AddBankFormBodySchema, body);

	if (!parsed.success) {
		log.warn({ issues: parsed.issues }, 'add bank rejected — invalid request body');
		error(400, parsed.issues[0]?.message ?? 'Invalid bank account payload');
	}

	let upstreamBody;
	try {
		upstreamBody = buildAddOrganizationBankRequest(parsed.output);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Invalid bank account payload';
		log.warn({ message }, 'add bank rejected — mapping failed');
		error(400, message);
	}

	const result = await organizationClient.addBank(
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

	const accountId = extractBankAccountId(result.data);

	return json({
		message: result.data.message ?? 'Bank account added successfully',
		accountId,
		statusCode: result.data.statusCode ?? 201
	});
};
