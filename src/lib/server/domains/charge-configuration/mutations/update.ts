import * as v from 'valibot';
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
import { chargeConfigurationClient, UpdateChargeConfigurationRequestSchema } from '../client';
import type { UpdateChargeConfigurationRequest } from '../schema';

export type UpdateChargeConfigurationSuccess = {
	message: string;
};

export async function updateChargeConfigurationMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	chargeConfigId: string;
	body: UpdateChargeConfigurationRequest;
}): Promise<MutationResult<UpdateChargeConfigurationSuccess>> {
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

	const parsed = v.safeParse(UpdateChargeConfigurationRequestSchema, params.body);
	if (!parsed.success) {
		params.log.warn(
			{ issues: parsed.issues },
			'update charge configuration rejected — invalid body'
		);
		return mutationFailure(
			400,
			parsed.issues[0]?.message ?? 'Invalid charge configuration payload'
		);
	}

	const result = await chargeConfigurationClient.update(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		chargeConfigId,
		parsed.output
	);

	if (!result.ok) {
		return upstreamErrorToFailure(result.error);
	}

	return {
		ok: true,
		message: result.data.message ?? 'Charge configuration updated successfully'
	};
}
