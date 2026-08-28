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
import { disputeClient, CreateDisputeRequestSchema } from '../client';
import type { CreateDisputeRequest } from '../schema';

export type CreateDisputeSuccess = {
	message: string;
	disputeId: string;
	status: string;
};

function toApiAmount(value: string): string | null {
	const amount = Number(value.replace(/[₹,\s]/g, ''));
	if (!Number.isFinite(amount) || amount <= 0) return null;
	return amount.toFixed(2);
}

export async function createDisputeMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	body: unknown;
}): Promise<MutationResult<CreateDisputeSuccess>> {
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

	const parsed = v.safeParse(CreateDisputeRequestSchema, params.body);
	if (!parsed.success) {
		params.log.warn({ issues: parsed.issues }, 'create dispute rejected — invalid body');
		return mutationFailure(400, parsed.issues[0]?.message ?? 'Invalid dispute payload');
	}

	const amount = toApiAmount(parsed.output.amount);
	if (!amount) {
		return mutationFailure(400, 'Enter a valid dispute amount');
	}

	if (parsed.output.orderId === '—') {
		return mutationFailure(400, 'Order ID is required');
	}

	const body: CreateDisputeRequest = {
		actorType: 'user',
		amount,
		assignedTo: parsed.output.assignedTo,
		currency: 'INR',
		orderId: parsed.output.orderId,
		pipelineTransactionId: parsed.output.pipelineTransactionId,
		source: parsed.output.source,
		status: 'DISPUTE_RAISED'
	};

	params.log.info(
		{
			orgId,
			orderId: body.orderId,
			pipelineTransactionId: body.pipelineTransactionId,
			source: body.source,
			assignedTo: body.assignedTo
		},
		'create dispute — POST upstream'
	);

	const result = await disputeClient.create(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		body
	);

	if (!result.ok) {
		params.log.warn(
			{ orgId, message: result.error.message, kind: result.error.kind },
			'create dispute — upstream failed'
		);
		return upstreamErrorToFailure(result.error);
	}

	const created = result.data.data[0];
	if (!created?.disputeId) {
		params.log.warn({ orgId }, 'create dispute — missing dispute id in response');
		return mutationFailure(502, 'Dispute was created but no dispute ID was returned');
	}

	params.log.info(
		{
			orgId,
			disputeId: created.disputeId,
			status: created.status,
			upstreamMessage: result.data.message,
			upstreamStatusCode: result.data.statusCode
		},
		'create dispute — success'
	);

	return {
		ok: true,
		message: result.data.message ?? 'Dispute created successfully.',
		disputeId: created.disputeId,
		status: created.status
	};
}
