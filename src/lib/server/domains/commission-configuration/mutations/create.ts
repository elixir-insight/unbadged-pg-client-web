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
import {
	commissionConfigurationClient,
	CreateCommissionConfigurationsRequestSchema
} from '../client';
import type { CreateCommissionConfigurationsRequest } from '../schema';

export type CreateCommissionConfigurationsSuccess = {
	message: string;
};

export async function createCommissionConfigurationsMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	body: CreateCommissionConfigurationsRequest;
}): Promise<MutationResult<CreateCommissionConfigurationsSuccess>> {
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

	const parsed = v.safeParse(CreateCommissionConfigurationsRequestSchema, params.body);
	if (!parsed.success) {
		params.log.warn(
			{ issues: parsed.issues },
			'create commission configurations rejected — invalid body'
		);
		return mutationFailure(
			400,
			parsed.issues[0]?.message ?? 'Invalid commission configuration payload'
		);
	}

	if (parsed.output.commissionConfig.length === 0) {
		return mutationFailure(400, 'At least one commission configuration is required');
	}

	params.log.info(
		{
			orgId,
			commissionConfigCount: parsed.output.commissionConfig.length,
			methodConfigIds: [
				...new Set(parsed.output.commissionConfig.map((item) => String(item.methodConfigId)))
			],
			pipelineCodes: [...new Set(parsed.output.commissionConfig.map((item) => item.pipelineCode))],
			vaNumbers: [...new Set(parsed.output.commissionConfig.map((item) => item.vaNumber))]
		},
		'create commission configurations — POST upstream'
	);

	const result = await commissionConfigurationClient.create(
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
			'create commission configurations — upstream failed'
		);
		return upstreamErrorToFailure(result.error);
	}

	params.log.info(
		{
			orgId,
			commissionConfigCount: parsed.output.commissionConfig.length,
			upstreamMessage: result.data.message,
			upstreamStatusCode: result.data.statusCode
		},
		'create commission configurations — success'
	);

	return {
		ok: true,
		message: result.data.message ?? 'Commission configurations created successfully'
	};
}
