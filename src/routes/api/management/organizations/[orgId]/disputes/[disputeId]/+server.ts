import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateDisputeMutation } from '$lib/server/domains/dispute/mutations/update';

export const PATCH: RequestHandler = async ({ params, request, cookies, locals, fetch }) => {
	const orgId = params.orgId?.trim() ?? '';
	const disputeId = params.disputeId?.trim() ?? '';
	const log = locals.logger.child({ action: 'disputes-update' });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}

	if (!disputeId) {
		return json({ message: 'Dispute id is required' }, { status: 400 });
	}

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') {
		return json({ message: 'Invalid dispute payload' }, { status: 400 });
	}

	const result = await updateDisputeMutation({
		fetch,
		log,
		cookies,
		orgId,
		disputeId,
		body
	});

	console.log(body, 'body');

	if (!result.ok) {
		log.warn(
			{ orgId, disputeId, status: result.status, message: result.message },
			'update dispute — PATCH failed'
		);
		return json({ message: result.message }, { status: result.status });
	}

	log.info(
		{ orgId, disputeId, status: result.status, message: result.message },
		'update dispute — PATCH succeeded'
	);

	return json({
		disputeId: result.disputeId,
		status: result.status,
		message: result.message
	});
};
