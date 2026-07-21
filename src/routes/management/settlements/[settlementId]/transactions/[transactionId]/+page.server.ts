import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { settlementClient } from '$lib/server/domains/settlement/client';
import { mapSettlementDetailItem } from '$lib/server/domains/settlement/mappers/from-api/details';

const DEFAULT_LIMIT = 10;

function positiveInteger(value: string | null, fallback: number): number {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const load: PageServerLoad = async ({ params, url, cookies, fetch, locals, depends }) => {
	depends('management-settlement:transaction-detail');

	const settlementId = params.settlementId?.trim();
	const transactionId = params.transactionId?.trim();
	if (!settlementId || !transactionId) error(404, 'Settlement transaction not found');

	const limit = positiveInteger(url.searchParams.get('limit'), DEFAULT_LIMIT);
	const skip = Math.max(0, Number(url.searchParams.get('skip')) || 0);
	const sourcePage = Math.floor(skip / limit) + 1;
	const log = locals.logger.child({
		action: 'management-settlement-transaction-detail',
		settlementId,
		transactionId
	});

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (sessionError) {
		if (sessionError instanceof SessionInactiveError || sessionError instanceof SessionError) {
			error(401, sessionError.message);
		}
		throw sessionError;
	}

	const result = await settlementClient.getDetails(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		settlementId,
		{ page: sourcePage, limit }
	);

	if (!result.ok) {
		log.warn(
			{ kind: result.error.kind, message: result.error.message },
			'GET management settlement transaction detail failed'
		);
		error(result.error.kind === 'http' ? (result.error.status ?? 502) : 502, result.error.message);
	}

	const transaction = result.data.data.find(
		(item) => (item.payinAttemptId?.trim() || item.id) === transactionId
	);
	if (!transaction) error(404, 'Settlement transaction not found on the source page');

	return {
		settlementId,
		transaction,
		displayTransaction: mapSettlementDetailItem(transaction),
		sourcePage,
		sourceLimit: limit
	};
};
