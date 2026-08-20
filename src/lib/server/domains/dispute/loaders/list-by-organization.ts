import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import type { DisputeStatusOption } from '$lib/utils/dispute-status';
import { disputeClient, type DisputeListQuery, type DisputePortal } from '../client';
import {
	emptyDisputePagination,
	mapDisputeListResponse,
	type DisputeListRow
} from '../mappers/from-api/list';
import type { DisputePagination } from '../schema';

export type DisputesLoadResult = {
	disputes: DisputeListRow[];
	pagination: DisputePagination;
	disputesError: string | null;
};

export async function loadDisputesByOrganization(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	query: DisputeListQuery;
	statuses?: DisputeStatusOption[];
	portal?: DisputePortal;
}): Promise<DisputesLoadResult> {
	const orgId = params.orgId.trim();
	const limit = params.query.limit ?? 10;
	const page = params.query.page ?? 0;
	const portal = params.portal ?? 'management';
	const empty = {
		disputes: [] as DisputeListRow[],
		pagination: emptyDisputePagination(limit, page),
		disputesError: null as string | null
	};

	if (!orgId) {
		return { ...empty, disputesError: 'Organization id is required' };
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) {
		return { ...empty, disputesError: session.message };
	}

	const result = await disputeClient.listByOrganization(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		{
			status: params.query.status,
			source: params.query.source,
			limit,
			page
		},
		portal
	);

	if (!result.ok) {
		params.log.warn(
			{ orgId, portal, message: result.error.message, kind: result.error.kind },
			'GET disputes failed'
		);
		return { ...empty, disputesError: result.error.message };
	}

	return {
		disputes: mapDisputeListResponse(result.data.data, params.statuses),
		pagination: result.data.pagination,
		disputesError: null
	};
}
