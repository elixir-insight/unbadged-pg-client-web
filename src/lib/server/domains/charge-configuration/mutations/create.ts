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
import { chargeConfigurationClient, CreateChargeConfigurationsRequestSchema } from '../client';
import type { CreateChargeConfigurationsRequest } from '../schema';

export type CreateChargeConfigurationsSuccess = {
	message: string;
};

export async function createChargeConfigurationsMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	body: CreateChargeConfigurationsRequest;
}): Promise<MutationResult<CreateChargeConfigurationsSuccess>> {
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

	const parsed = v.safeParse(CreateChargeConfigurationsRequestSchema, params.body);
	if (!parsed.success) {
		params.log.warn(
			{ issues: parsed.issues },
			'create charge configurations rejected — invalid body'
		);
		return mutationFailure(
			400,
			parsed.issues[0]?.message ?? 'Invalid charge configuration payload'
		);
	}

	if (parsed.output.chargeConfig.length === 0) {
		return mutationFailure(400, 'At least one charge configuration is required');
	}

	params.log.info(
		{
			orgId,
			chargeConfigCount: parsed.output.chargeConfig.length,
			methodConfigIds: [
				...new Set(parsed.output.chargeConfig.map((item) => String(item.methodConfigId)))
			],
			pipelineCodes: [...new Set(parsed.output.chargeConfig.map((item) => item.pipelineCode))],
			vaNumbers: [...new Set(parsed.output.chargeConfig.map((item) => item.vaNumber))]
		},
		'create charge configurations — POST upstream'
	);

	const result = await chargeConfigurationClient.create(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		parsed.output
	);

	if (!result.ok) {
		params.log.warn(
			{ orgId, message: result.error.message, kind: result.error.kind },
			'create charge configurations — upstream failed'
		);
		return upstreamErrorToFailure(result.error);
	}

	params.log.info(
		{
			orgId,
			chargeConfigCount: parsed.output.chargeConfig.length,
			upstreamMessage: result.data.message,
			upstreamStatusCode: result.data.statusCode
		},
		'create charge configurations — success'
	);

	return {
		ok: true,
		message: result.data.message ?? 'Charge configurations created successfully'
	};
}
