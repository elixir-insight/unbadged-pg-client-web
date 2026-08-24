import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createDisputeChargebackMutation } from '$lib/server/domains/dispute/mutations/create-chargeback';

export const POST: RequestHandler = async ({ params, request, cookies, locals, fetch }) => {
	const orgId = params.orgId?.trim() ?? '';
	const disputeId = params.disputeId?.trim() ?? '';
	const log = locals.logger.child({ action: 'disputes-create-chargeback' });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}

	if (!disputeId) {
		return json({ message: 'Dispute id is required' }, { status: 400 });
	}

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') {
		return json({ message: 'Invalid chargeback payload' }, { status: 400 });
	}

	const result = await createDisputeChargebackMutation({
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
			'create dispute chargeback — POST failed'
		);
		return json({ message: result.message }, { status: result.status });
	}

	log.info(
		{
			orgId,
			disputeId,
			chargebackId: result.chargeback?.id,
			message: result.message
		},
		'create dispute chargeback — POST succeeded'
	);

	return json(
		{
			message: result.message,
			chargeback: result.chargeback
		},
		{ status: 201 }
	);
};
