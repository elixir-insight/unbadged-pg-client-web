import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateDisputeDocumentMutation } from '$lib/server/domains/dispute/mutations/update-document';

export const PATCH: RequestHandler = async ({ params, request, cookies, locals, fetch }) => {
	const orgId = params.orgId?.trim() ?? '';
	const disputeId = params.disputeId?.trim() ?? '';
	const documentId = params.documentId?.trim() ?? '';
	const log = locals.logger.child({ action: 'disputes-update-document' });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}
	if (!disputeId) {
		return json({ message: 'Dispute id is required' }, { status: 400 });
	}
	if (!documentId) {
		return json({ message: 'Document id is required' }, { status: 400 });
	}

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') {
		return json({ message: 'Invalid document update payload' }, { status: 400 });
	}

	const result = await updateDisputeDocumentMutation({
		fetch,
		log,
		cookies,
		orgId,
		disputeId,
		documentId,
		body
	});

	if (!result.ok) {
		log.warn(
			{ orgId, disputeId, documentId, status: result.status, message: result.message },
			'update dispute document — PATCH failed'
		);
		return json({ message: result.message }, { status: result.status });
	}

	log.info(
		{ orgId, disputeId, documentId, message: result.message },
		'update dispute document — PATCH succeeded'
	);

	return json({ message: result.message });
};
