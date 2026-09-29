import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import { disputeClient, type DisputePortal } from '../client';
import {
	emptyDisputePagination,
	mapChargebackDetailResponse,
	type ChargebackDetailRow
} from '../mappers/from-api/chargeback-detail';
import type { DisputePagination } from '../schema';

export type ChargebackDetailLoadResult = {
	rows: ChargebackDetailRow[];
	pagination: DisputePagination;
	listError: string | null;
};

export async function loadChargebacksByOrganization(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	limit: number;
	page: number;
	portal?: DisputePortal;
}): Promise<ChargebackDetailLoadResult> {
	const orgId = params.orgId.trim();
	const portal = params.portal ?? 'management';
	const empty = {
		rows: [] as ChargebackDetailRow[],
		pagination: emptyDisputePagination(params.limit, params.page),
		listError: null as string | null
	};

	if (!orgId) {
		return { ...empty, listError: 'Organization id is required' };
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) {
		return { ...empty, listError: session.message };
	}

	const result = await disputeClient.listChargebacksByOrganization(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		{ limit: params.limit, page: params.page },
		portal
	);

	if (!result.ok) {
		params.log.warn(
			{ orgId, portal, message: result.error.message, kind: result.error.kind },
			'GET organization chargebacks failed'
		);
		return { ...empty, listError: result.error.message };
	}

	return {
		rows: mapChargebackDetailResponse(result.data.data),
		pagination: result.data.pagination,
		listError: null
	};
}
