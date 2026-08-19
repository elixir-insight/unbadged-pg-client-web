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
import { disputeClient, UpdateDisputeStatusRequestSchema } from '../client';
import type { UpdateDisputeStatusRequest } from '../schema';

export type UpdateDisputeStatusSuccess = {
	message: string;
	status: string;
};

export async function updateDisputeStatusMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	disputeId: string;
	body: unknown;
}): Promise<MutationResult<UpdateDisputeStatusSuccess>> {
	const orgId = params.orgId.trim();
	const disputeId = params.disputeId.trim();

	if (!orgId) {
		return mutationFailure(400, 'Organization id is required');
	}

	if (!disputeId) {
		return mutationFailure(400, 'Dispute id is required');
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const parsed = v.safeParse(UpdateDisputeStatusRequestSchema, params.body);
	if (!parsed.success) {
		params.log.warn({ issues: parsed.issues }, 'update dispute status rejected — invalid body');
		return mutationFailure(400, parsed.issues[0]?.message ?? 'Invalid status payload');
	}

	const body: UpdateDisputeStatusRequest = {
		fromStatus: parsed.output.fromStatus,
		toStatus: parsed.output.toStatus,
		actorType: 'user',
		note: parsed.output.note
	};

	params.log.info(
		{ orgId, disputeId, fromStatus: body.fromStatus, toStatus: body.toStatus },
		'update dispute status — POST upstream'
	);

	const result = await disputeClient.createEvent(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		disputeId,
		body
	);

	if (!result.ok) {
		params.log.warn(
			{ orgId, disputeId, message: result.error.message, kind: result.error.kind },
			'update dispute status — upstream failed'
		);
		return upstreamErrorToFailure(result.error);
	}

	const created = result.data.data[0];
	return {
		ok: true,
		message: result.data.message ?? 'Dispute status updated successfully.',
		status: created?.toStatus || body.toStatus
	};
}
