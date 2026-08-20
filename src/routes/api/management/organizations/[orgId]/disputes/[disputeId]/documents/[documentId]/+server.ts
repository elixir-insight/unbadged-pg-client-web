import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteDisputeDocumentMutation } from '$lib/server/domains/dispute/mutations/delete-document';

export const DELETE: RequestHandler = async ({ params, cookies, locals, fetch }) => {
	const orgId = params.orgId?.trim() ?? '';
	const disputeId = params.disputeId?.trim() ?? '';
	const documentId = params.documentId?.trim() ?? '';
	const log = locals.logger.child({ action: 'disputes-delete-document' });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}
	if (!disputeId) {
		return json({ message: 'Dispute id is required' }, { status: 400 });
	}
	if (!documentId) {
		return json({ message: 'Document id is required' }, { status: 400 });
	}

	const result = await deleteDisputeDocumentMutation({
		fetch,
		log,
		cookies,
		orgId,
		disputeId,
		documentId
	});

	if (!result.ok) {
		log.warn(
			{ orgId, disputeId, documentId, status: result.status, message: result.message },
			'delete dispute document — DELETE failed'
		);
		return json({ message: result.message }, { status: result.status });
	}

	log.info(
		{ orgId, disputeId, documentId, message: result.message },
		'delete dispute document — DELETE succeeded'
	);

	return json({ message: result.message });
};
