import * as v from 'valibot';
import type { Logger } from 'pino';
import { organizationClient } from '$lib/server/domains/organization/client';
import { extractOrganizationId } from '$lib/server/domains/organization/utils/extract-id';
import {
	buildCreateOrganizationRequest,
	CreateOrganizationFormBodySchema,
	type CreateOrganizationFormBody
} from '$lib/server/domains/organization/mappers/to-api/create-organization';
import { isSessionFailure, requireSession, type SessionTokens } from './session';
import { mutationFailure, upstreamErrorToFailure, type MutationResult } from './types';

export type CreateOrganizationSuccess = {
	organizationId: string;
	message: string;
};

export async function createOrganizationMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	body: CreateOrganizationFormBody;
}): Promise<MutationResult<CreateOrganizationSuccess>> {
	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const parsed = v.safeParse(CreateOrganizationFormBodySchema, params.body);
	if (!parsed.success) {
		params.log.warn({ issues: parsed.issues }, 'create organization rejected — invalid body');
		return mutationFailure(400, parsed.issues[0]?.message ?? 'Invalid organization payload');
	}

	let upstreamBody;
	try {
		upstreamBody = buildCreateOrganizationRequest(parsed.output);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Invalid organization payload';
		params.log.warn({ message }, 'create organization rejected — mapping failed');
		return mutationFailure(400, message);
	}

	return executeCreate(params.fetch, params.log, session, upstreamBody);
}

async function executeCreate(
	fetchFn: typeof fetch,
	log: Logger,
	session: SessionTokens,
	upstreamBody: ReturnType<typeof buildCreateOrganizationRequest>
): Promise<MutationResult<CreateOrganizationSuccess>> {
	const result = await organizationClient.create(
		fetchFn,
		log,
		session.accessToken,
		session.gatewayToken,
		upstreamBody
	);

	if (!result.ok) {
		return upstreamErrorToFailure(result.error);
	}

	const organizationId = extractOrganizationId(result.data);
	if (!organizationId) {
		log.warn({ upstream: result.data }, 'create organization succeeded without orgId');
		return mutationFailure(502, 'Organization created but no orgId was returned');
	}

	return {
		ok: true,
		organizationId,
		message: result.data.message ?? 'Organization created successfully'
	};
}
