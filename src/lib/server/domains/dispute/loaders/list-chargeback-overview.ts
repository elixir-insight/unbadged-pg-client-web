import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import { disputeClient } from '../client';
import {
	emptyDisputePagination,
	mapChargebackOverviewResponse,
	type ChargebackOverviewRow
} from '../mappers/from-api/chargeback-overview';
import type { DisputePagination } from '../schema';

export type ChargebackOverviewLoadResult = {
	rows: ChargebackOverviewRow[];
	pagination: DisputePagination;
	listError: string | null;
};

export async function loadChargebackOverview(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	limit: number;
	page: number;
}): Promise<ChargebackOverviewLoadResult> {
	const empty = {
		rows: [] as ChargebackOverviewRow[],
		pagination: emptyDisputePagination(params.limit, params.page),
		listError: null as string | null
	};

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) {
		return { ...empty, listError: session.message };
	}

	const result = await disputeClient.listChargebackOverview(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		{ limit: params.limit, page: params.page }
	);

	if (!result.ok) {
		params.log.warn(
			{ message: result.error.message, kind: result.error.kind },
			'GET chargeback overview failed'
		);
		return { ...empty, listError: result.error.message };
	}

	return {
		rows: mapChargebackOverviewResponse(result.data.data),
		pagination: result.data.pagination,
		listError: null
	};
}
