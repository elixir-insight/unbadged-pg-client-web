import * as v from 'valibot';
import type { Logger } from 'pino';
import { organizationClient } from '$lib/server/domains/organization/client';
import {
	UpdateOrganizationStatusRequestSchema,
	type UpdateOrganizationStatusRequest
} from '$lib/server/domains/organization/schema';
import { isSessionFailure, requireSession } from './session';
import { mutationFailure, upstreamErrorToFailure, type MutationResult } from './types';

export type UpdateStatusSuccess = {
	message: string;
};

export async function updateOrganizationStatusMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	body: UpdateOrganizationStatusRequest;
}): Promise<MutationResult<UpdateStatusSuccess>> {
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

	const parsed = v.safeParse(UpdateOrganizationStatusRequestSchema, params.body);
	if (!parsed.success) {
		params.log.warn(
			{ issues: parsed.issues },
			'update organization status rejected — invalid body'
		);
		return mutationFailure(400, parsed.issues[0]?.message ?? 'Invalid status payload');
	}

	const result = await organizationClient.updateStatus(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		parsed.output
	);

	if (!result.ok) {
		return upstreamErrorToFailure(result.error);
	}

	return {
		ok: true,
		message: result.data.message ?? 'Organization status updated successfully'
	};
}
