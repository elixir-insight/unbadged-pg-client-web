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
import { disputeClient, UpdateDisputeDocumentRequestSchema } from '../client';
import type { UpdateDisputeDocumentRequest } from '../schema';

export type UpdateDisputeDocumentSuccess = {
	message: string;
};

export async function updateDisputeDocumentMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	disputeId: string;
	documentId: string;
	body: unknown;
}): Promise<MutationResult<UpdateDisputeDocumentSuccess>> {
	const orgId = params.orgId.trim();
	const disputeId = params.disputeId.trim();
	const documentId = params.documentId.trim();

	if (!orgId) {
		return mutationFailure(400, 'Organization id is required');
	}
	if (!disputeId) {
		return mutationFailure(400, 'Dispute id is required');
	}
	if (!documentId) {
		return mutationFailure(400, 'Document id is required');
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const parsed = v.safeParse(UpdateDisputeDocumentRequestSchema, params.body);
	if (!parsed.success) {
		params.log.warn({ issues: parsed.issues }, 'update dispute document rejected — invalid body');
		return mutationFailure(400, parsed.issues[0]?.message ?? 'Invalid document update payload');
	}

	const body: UpdateDisputeDocumentRequest = {};
	if (parsed.output.reviewNote !== undefined) body.reviewNote = parsed.output.reviewNote;
	if (parsed.output.reviewStatus !== undefined) {
		body.reviewStatus = parsed.output.reviewStatus.trim().toUpperCase();
	}
	if (parsed.output.visibleToMerchant !== undefined) {
		body.visibleToMerchant = parsed.output.visibleToMerchant;
	}

	params.log.info(
		{
			orgId,
			disputeId,
			documentId,
			fields: Object.keys(body)
		},
		'update dispute document — PATCH upstream'
	);

	const result = await disputeClient.updateDocument(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		disputeId,
		documentId,
		body
	);

	if (!result.ok) {
		params.log.warn(
			{
				orgId,
				disputeId,
				documentId,
				message: result.error.message,
				kind: result.error.kind
			},
			'update dispute document — upstream failed'
		);
		return upstreamErrorToFailure(result.error);
	}

	return {
		ok: true,
		message: result.data.message ?? 'Document updated successfully'
	};
}
