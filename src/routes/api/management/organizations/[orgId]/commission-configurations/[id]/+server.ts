import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteCommissionConfigurationMutation } from '$lib/server/domains/commission-configuration/mutations/delete';

export const DELETE: RequestHandler = async ({ params, cookies, locals, fetch }) => {
	const orgId = params.orgId?.trim() ?? '';
	const commissionConfigId = params.id?.trim() ?? '';
	const log = locals.logger.child({ action: 'commission-configurations-delete' });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}

	const result = await deleteCommissionConfigurationMutation({
		fetch,
		log,
		cookies,
		orgId,
		commissionConfigId
	});

	if (!result.ok) {
		return json({ message: result.message }, { status: result.status });
	}

	return json({ message: result.message });
};
