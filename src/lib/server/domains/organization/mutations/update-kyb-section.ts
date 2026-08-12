import * as v from 'valibot';
import type { Logger } from 'pino';
import { organizationClient } from '$lib/server/domains/organization/client';
import {
	buildUpdateOrganizationSectionRequest,
	UpdateOrganizationSectionFormBodySchema,
	type UpdateOrganizationSectionFormBody
} from '$lib/server/domains/organization/mappers/to-api/update-kyb';
import { readRememberedOrgBrandName, rememberOrgBrandName } from '../utils/org-brand-name-cookie';
import { isSessionFailure, requireSession, type SessionTokens } from './session';
import { mutationFailure, upstreamErrorToFailure, type MutationResult } from './types';

export type UpdateKybSectionSuccess = {
	message: string;
};

export async function updateKybSectionMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	body: UpdateOrganizationSectionFormBody;
}): Promise<MutationResult<UpdateKybSectionSuccess>> {
	const orgId = params.orgId.trim();
	if (!orgId) {
		return mutationFailure(400, 'Organization id is required');
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const parsed = v.safeParse(UpdateOrganizationSectionFormBodySchema, params.body);
	if (!parsed.success) {
		params.log.warn({ issues: parsed.issues }, 'update organization rejected — invalid body');
		return mutationFailure(400, parsed.issues[0]?.message ?? 'Invalid organization payload');
	}

	const rememberedBrandName = readRememberedOrgBrandName(params.cookies, orgId);
	const output =
		parsed.output.category === 'PARTNER' && !parsed.output.brandName?.trim() && rememberedBrandName
			? { ...parsed.output, brandName: rememberedBrandName }
			: parsed.output;

	if (output.category === 'PARTNER' && output.brandName?.trim()) {
		rememberOrgBrandName(params.cookies, orgId, output.brandName);
	}

	let upstreamBody;
	try {
		upstreamBody = buildUpdateOrganizationSectionRequest(output);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Invalid organization payload';
		params.log.warn({ message }, 'update organization rejected — mapping failed');
		return mutationFailure(400, message);
	}

	return executeUpdate(params.fetch, params.log, session, orgId, upstreamBody);
}

async function executeUpdate(
	fetchFn: typeof fetch,
	log: Logger,
	session: SessionTokens,
	orgId: string,
	upstreamBody: ReturnType<typeof buildUpdateOrganizationSectionRequest>
): Promise<MutationResult<UpdateKybSectionSuccess>> {
	const result = await organizationClient.update(
		fetchFn,
		log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		upstreamBody
	);

	if (!result.ok) {
		return upstreamErrorToFailure(result.error);
	}

	return {
		ok: true,
		message: result.data.message ?? 'Organization updated successfully'
	};
}
