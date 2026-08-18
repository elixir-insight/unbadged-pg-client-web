import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import {
	mutationFailure,
	upstreamErrorToFailure,
	type MutationResult
} from '$lib/server/domains/organization/mutations/types';
import { commissionConfigurationClient } from '../client';

export type DeleteCommissionConfigurationSuccess = {
	message: string;
};

export async function deleteCommissionConfigurationMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	commissionConfigId: string;
}): Promise<MutationResult<DeleteCommissionConfigurationSuccess>> {
	const orgId = params.orgId.trim();
	const commissionConfigId = params.commissionConfigId.trim();

	if (!orgId) {
		return mutationFailure(400, 'Organization id is required');
	}
	if (!commissionConfigId) {
		return mutationFailure(400, 'Commission configuration id is required');
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const result = await commissionConfigurationClient.delete(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		commissionConfigId
	);

	if (!result.ok) {
		return upstreamErrorToFailure(result.error);
	}

	return {
		ok: true,
		message: result.data.message ?? 'Commission configuration deleted successfully'
	};
}
