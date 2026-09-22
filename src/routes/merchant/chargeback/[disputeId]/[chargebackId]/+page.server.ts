import type { PageServerLoad } from './$types';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { loadChargebackById } from '$lib/server/domains/dispute/loaders/get-chargeback-by-id';
import type { ChargebackDetailRow } from '$lib/server/domains/dispute/mappers/from-api/chargeback-detail';

export const load: PageServerLoad = async ({ params, cookies, fetch, locals, depends }) => {
	depends('merchant-chargebacks:detail');
	requirePermission(locals.userPermissions, 'PAYINS', 'read');

	const disputeId = params.disputeId?.trim() ?? '';
	const chargebackId = params.chargebackId?.trim() ?? '';
	const orgId =
		locals.merchantSession?.displayOrgId?.trim() ||
		locals.merchantSession?.organizationId?.trim() ||
		'';
	const log = locals.logger.child({
		action: 'merchant-chargeback-detail',
		orgId,
		disputeId,
		chargebackId
	});

	const empty = {
		orgId,
		disputeId,
		chargebackId,
		chargeback: null as ChargebackDetailRow | null,
		chargebackError: null as string | null
	};

	if (!disputeId) {
		return { ...empty, chargebackError: 'Dispute id is required' };
	}
	if (!chargebackId) {
		return { ...empty, chargebackError: 'Chargeback id is required' };
	}
	if (!orgId) {
		return {
			...empty,
			chargebackError: 'Organization id is unavailable for this session.'
		};
	}

	const result = await loadChargebackById({
		fetch,
		log,
		cookies,
		orgId,
		disputeId,
		chargebackId,
		portal: 'merchant'
	});

	return {
		orgId,
		disputeId,
		chargebackId,
		chargeback: result.chargeback,
		chargebackError: result.chargebackError
	};
};
