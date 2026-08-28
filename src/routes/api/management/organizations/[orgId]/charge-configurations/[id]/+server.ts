import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteChargeConfigurationMutation } from '$lib/server/domains/charge-configuration/mutations/delete';
import { updateChargeConfigurationMutation } from '$lib/server/domains/charge-configuration/mutations/update';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';

export const DELETE: RequestHandler = async ({ params, cookies, locals, fetch }) => {
	requirePermission(locals.userPermissions, 'ORGANIZATION', 'delete');
	const orgId = params.orgId?.trim() ?? '';
	const chargeConfigId = params.id?.trim() ?? '';
	const log = locals.logger.child({ action: 'charge-configurations-delete' });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}

	const result = await deleteChargeConfigurationMutation({
		fetch,
		log,
		cookies,
		orgId,
		chargeConfigId
	});

	if (!result.ok) {
		return json({ message: result.message }, { status: result.status });
	}

	return json({ message: result.message });
};

export const PATCH: RequestHandler = async ({ params, request, cookies, locals, fetch }) => {
	requirePermission(locals.userPermissions, 'ORGANIZATION', 'write');
	const orgId = params.orgId?.trim() ?? '';
	const chargeConfigId = params.id?.trim() ?? '';
	const log = locals.logger.child({ action: 'charge-configurations-update' });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') {
		return json({ message: 'Invalid charge configuration payload' }, { status: 400 });
	}

	const result = await updateChargeConfigurationMutation({
		fetch,
		log,
		cookies,
		orgId,
		chargeConfigId,
		body: body as {
			baseAmount: string;
			chargeRate: string;
			chargeType: string;
			gstExclusive: boolean;
			gstPercentage: string;
		}
	});

	if (!result.ok) {
		return json({ message: result.message }, { status: result.status });
	}

	return json({ message: result.message });
};
