import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { settlementClient } from '$lib/server/domains/settlement/client';
import { mapSettlementListItemToDetail } from '$lib/server/domains/settlement/mappers/from-api/list';

export const load: PageServerLoad = async ({ params, cookies, fetch, locals }) => {
	const settlementId = params.settlementId?.trim();
	if (!settlementId) error(404, 'Settlement not found');

	const log = locals.logger.child({ action: 'settlement-detail', settlementId });

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			error(401, e.message);
		}
		throw e;
	}

	// No dedicated get-by-id endpoint yet — resolve via list search on settlementId.
	const result = await settlementClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, {
		page: 1,
		limit: 20,
		search: settlementId
	});

	if (!result.ok) {
		log.warn(
			{
				kind: result.error.kind,
				message: result.error.message
			},
			'GET merchant settlement by id failed'
		);
		error(result.error.kind === 'http' ? (result.error.status ?? 502) : 502, result.error.message);
	}

	const item = result.data.data.find((row) => row.settlementId === settlementId);
	if (!item) error(404, 'Settlement not found');

	return {
		settlement: mapSettlementListItemToDetail(item)
	};
};
