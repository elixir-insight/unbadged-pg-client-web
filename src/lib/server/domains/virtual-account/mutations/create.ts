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
import { virtualAccountClient } from '../client';
import { CreateVirtualAccountRequestSchema, type CreateVirtualAccountRequest } from '../schema';

export type CreateVirtualAccountSuccess = {
	message: string;
};

export async function createVirtualAccountMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	body: CreateVirtualAccountRequest;
}): Promise<MutationResult<CreateVirtualAccountSuccess>> {
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

	const parsed = v.safeParse(CreateVirtualAccountRequestSchema, params.body);
	if (!parsed.success) {
		params.log.warn({ issues: parsed.issues }, 'create virtual account rejected — invalid body');
		return mutationFailure(400, parsed.issues[0]?.message ?? 'Invalid virtual account payload');
	}

	const result = await virtualAccountClient.create(
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
		message: result.data.message ?? 'Virtual account created successfully'
	};
}
