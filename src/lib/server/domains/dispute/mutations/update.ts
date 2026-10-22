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
import { formatEvidenceDueByForApi } from '$lib/utils/format-time';
import { disputeClient, UpdateDisputeRequestSchema } from '../client';
import type { UpdateDisputeRequest } from '../schema';

export type UpdateDisputeSuccess = {
	message: string;
	disputeId: string;
	status: string;
};

function toPayload(input: UpdateDisputeRequest): UpdateDisputeRequest {
	const payload: UpdateDisputeRequest = {};
	if (input.bankRefNumber !== undefined) payload.bankRefNumber = input.bankRefNumber;
	if (input.evidenceDueBy !== undefined) {
		payload.evidenceDueBy = formatEvidenceDueByForApi(input.evidenceDueBy);
	}
	if (input.gatewayDescription !== undefined) payload.gatewayDescription = input.gatewayDescription;
	if (input.pipelineDescription !== undefined) {
		payload.pipelineDescription = input.pipelineDescription;
	}
	if (input.reasonCode !== undefined) payload.reasonCode = input.reasonCode;
	if (input.resolutionNotes !== undefined) payload.resolutionNotes = input.resolutionNotes;
	if (input.status !== undefined) payload.status = input.status;
	return payload;
}

export async function updateDisputeMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	disputeId: string;
	body: unknown;
}): Promise<MutationResult<UpdateDisputeSuccess>> {
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

	const parsed = v.safeParse(UpdateDisputeRequestSchema, params.body);
	if (!parsed.success) {
		params.log.warn({ issues: parsed.issues }, 'update dispute rejected — invalid body');
		return mutationFailure(400, parsed.issues[0]?.message ?? 'Invalid dispute payload');
	}

	const body = toPayload(parsed.output);
	if (Object.keys(body).length === 0) {
		return mutationFailure(400, 'No changes to update');
	}

	params.log.info(
		{ orgId, disputeId, fields: Object.keys(body) },
		'update dispute — PATCH upstream'
	);

	const result = await disputeClient.update(
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
			'update dispute — upstream failed'
		);
		return upstreamErrorToFailure(result.error);
	}

	const updated = result.data.data[0];
	return {
		ok: true,
		message: result.data.message ?? 'Dispute updated successfully.',
		disputeId: updated?.disputeId || disputeId,
		status: updated?.status || body.status || ''
	};
}
