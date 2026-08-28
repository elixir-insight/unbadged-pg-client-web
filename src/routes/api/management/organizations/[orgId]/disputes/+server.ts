import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createDisputeMutation } from '$lib/server/domains/dispute/mutations/create';

export const POST: RequestHandler = async ({ params, request, cookies, locals, fetch }) => {
	const orgId = params.orgId?.trim() ?? '';
	const log = locals.logger.child({ action: 'disputes-create' });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') {
		return json({ message: 'Invalid dispute payload' }, { status: 400 });
	}

	const result = await createDisputeMutation({
		fetch,
		log,
		cookies,
		orgId,
		body
	});

	if (!result.ok) {
		log.warn(
			{ orgId, status: result.status, message: result.message },
			'create dispute — POST failed'
		);
		return json({ message: result.message }, { status: result.status });
	}

	log.info(
		{ orgId, disputeId: result.disputeId, message: result.message },
		'create dispute — POST succeeded'
	);

	return json(
		{
			disputeId: result.disputeId,
			status: result.status,
			message: result.message
		},
		{ status: 201 }
	);
};
