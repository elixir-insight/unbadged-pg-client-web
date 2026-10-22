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
import { disputeClient, type DisputePortal } from '../client';

export type DisputeDocumentDownloadDisposition = 'inline' | 'attachment';

export type GetDisputeDocumentDownloadUrlSuccess = {
	message: string;
	url: string;
	expiresAt: string;
};

export async function getDisputeDocumentDownloadUrlMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	disputeId: string;
	documentId: string;
	disposition?: DisputeDocumentDownloadDisposition;
	portal?: DisputePortal;
}): Promise<MutationResult<GetDisputeDocumentDownloadUrlSuccess>> {
	const orgId = params.orgId.trim();
	const disputeId = params.disputeId.trim();
	const documentId = params.documentId.trim();
	const disposition = params.disposition === 'attachment' ? 'attachment' : 'inline';
	const portal = params.portal ?? 'management';

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

	params.log.info(
		{ orgId, disputeId, documentId, disposition, portal },
		'get dispute document download url — GET upstream'
	);

	const result = await disputeClient.getDocumentDownloadUrl(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		disputeId,
		documentId,
		disposition,
		portal
	);

	if (!result.ok) {
		params.log.warn(
			{
				orgId,
				disputeId,
				documentId,
				disposition,
				portal,
				message: result.error.message,
				kind: result.error.kind
			},
			'get dispute document download url — upstream failed'
		);
		return upstreamErrorToFailure(result.error);
	}

	const item = result.data.data[0];
	const url = item?.url?.trim() ?? '';
	if (!url) {
		return mutationFailure(502, 'Download URL was not returned');
	}

	return {
		ok: true,
		message: result.data.message ?? 'Download URL fetched successfully',
		url,
		expiresAt: item?.expiresAt?.trim() ?? ''
	};
}
