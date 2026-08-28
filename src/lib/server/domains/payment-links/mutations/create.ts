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
import { paymentLinksClient } from '../client';
import { buildCreatePaymentLinkRequest } from '../mappers/to-api/create';
import {
	CreatePaymentLinkClientRequestSchema,
	type CreatePaymentLinkClientRequest,
	type CreatePaymentLinkCreated
} from '../schema';

export type CreatePaymentLinkSuccess = {
	created: CreatePaymentLinkCreated;
};

export async function createPaymentLinkMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	body: CreatePaymentLinkClientRequest;
}): Promise<MutationResult<CreatePaymentLinkSuccess>> {
	const orgId = params.orgId.trim();
	if (!orgId) {
		return mutationFailure(400, 'Organization context is missing');
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const parsed = v.safeParse(CreatePaymentLinkClientRequestSchema, params.body);
	if (!parsed.success) {
		params.log.warn({ issues: parsed.issues }, 'create payment link rejected — invalid body');
		return mutationFailure(400, parsed.issues[0]?.message ?? 'Invalid payment link payload');
	}

	const upstreamBody = buildCreatePaymentLinkRequest(parsed.output);
	console.log(
		'Create payment link server payload',
		JSON.stringify({ orgId, ...upstreamBody }, null, 2)
	);

	const result = await paymentLinksClient.create(
		params.fetch,
		params.log,
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
		created: result.data
	};
}
