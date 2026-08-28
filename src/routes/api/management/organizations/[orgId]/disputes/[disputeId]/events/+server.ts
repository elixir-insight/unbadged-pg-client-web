import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateDisputeStatusMutation } from '$lib/server/domains/dispute/mutations/update-status';

export const POST: RequestHandler = async ({ params, request, cookies, locals, fetch }) => {
	const orgId = params.orgId?.trim() ?? '';
	const disputeId = params.disputeId?.trim() ?? '';
	const log = locals.logger.child({ action: 'disputes-update-status' });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}

	if (!disputeId) {
		return json({ message: 'Dispute id is required' }, { status: 400 });
	}

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') {
		return json({ message: 'Invalid status payload' }, { status: 400 });
	}

	const result = await updateDisputeStatusMutation({
		fetch,
		log,
		cookies,
		orgId,
		disputeId,
		body
	});

	if (!result.ok) {
		log.warn(
			{ orgId, disputeId, status: result.status, message: result.message },
			'update dispute status — POST failed'
		);
		return json({ message: result.message }, { status: result.status });
	}

	log.info(
		{ orgId, disputeId, status: result.status, message: result.message },
		'update dispute status — POST succeeded'
	);

	return json({
		status: result.status,
		message: result.message
	});
};
