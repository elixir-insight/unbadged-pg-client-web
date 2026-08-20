import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getDisputeDocumentDownloadUrlMutation,
	type DisputeDocumentDownloadDisposition
} from '$lib/server/domains/dispute/mutations/get-download-url';

function resolveDisposition(raw: string | null): DisputeDocumentDownloadDisposition {
	return raw?.trim().toLowerCase() === 'attachment' ? 'attachment' : 'inline';
}

export const GET: RequestHandler = async ({ params, url, cookies, locals, fetch }) => {
	const orgId = params.orgId?.trim() ?? '';
	const disputeId = params.disputeId?.trim() ?? '';
	const documentId = params.documentId?.trim() ?? '';
	const disposition = resolveDisposition(url.searchParams.get('disposition'));
	const log = locals.logger.child({ action: 'disputes-document-download-url' });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}
	if (!disputeId) {
		return json({ message: 'Dispute id is required' }, { status: 400 });
	}
	if (!documentId) {
		return json({ message: 'Document id is required' }, { status: 400 });
	}

	const result = await getDisputeDocumentDownloadUrlMutation({
		fetch,
		log,
		cookies,
		orgId,
		disputeId,
		documentId,
		disposition
	});

	if (!result.ok) {
		log.warn(
			{
				orgId,
				disputeId,
				documentId,
				disposition,
				status: result.status,
				message: result.message
			},
			'get dispute document download url — GET failed'
		);
		return json({ message: result.message }, { status: result.status });
	}

	log.info(
		{ orgId, disputeId, documentId, disposition, message: result.message },
		'get dispute document download url — GET succeeded'
	);

	return json({
		message: result.message,
		url: result.url,
		expiresAt: result.expiresAt
	});
};
