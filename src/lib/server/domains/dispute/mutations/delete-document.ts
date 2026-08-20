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
import { disputeClient } from '../client';

export type DeleteDisputeDocumentSuccess = {
	message: string;
};

export async function deleteDisputeDocumentMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	disputeId: string;
	documentId: string;
}): Promise<MutationResult<DeleteDisputeDocumentSuccess>> {
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

	params.log.info({ orgId, disputeId, documentId }, 'delete dispute document — DELETE upstream');

	const result = await disputeClient.deleteDocument(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		disputeId,
		documentId
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
			'delete dispute document — upstream failed'
		);
		return upstreamErrorToFailure(result.error);
	}

	return {
		ok: true,
		message: result.data.message ?? 'Document deleted successfully'
	};
}
