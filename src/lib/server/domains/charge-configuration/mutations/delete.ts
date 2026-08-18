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
import { chargeConfigurationClient } from '../client';

export type DeleteChargeConfigurationSuccess = {
	message: string;
};

export async function deleteChargeConfigurationMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	chargeConfigId: string;
}): Promise<MutationResult<DeleteChargeConfigurationSuccess>> {
	const orgId = params.orgId.trim();
	const chargeConfigId = params.chargeConfigId.trim();

	if (!orgId) {
		return mutationFailure(400, 'Organization id is required');
	}
	if (!chargeConfigId) {
		return mutationFailure(400, 'Charge configuration id is required');
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const result = await chargeConfigurationClient.delete(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		chargeConfigId
	);

	if (!result.ok) {
		return upstreamErrorToFailure(result.error);
	}

	return {
		ok: true,
		message: result.data.message ?? 'Charge configuration deleted successfully'
	};
}
