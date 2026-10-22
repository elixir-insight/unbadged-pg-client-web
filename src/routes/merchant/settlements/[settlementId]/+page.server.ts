import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { paymentAttemptClient } from '$lib/server/domains/payment-attempt/client';
import { settlementClient } from '$lib/server/domains/settlement/client';
import { mapSettlementListItemToDetail } from '$lib/server/domains/settlement/mappers/from-api/list';
import {
	mapSettlementOrderRows,
	type SettlementOrderRow
} from '$lib/server/domains/settlement/mappers/from-api/orders';
import {
	isNoPayinVirtualAccountError,
	resolvePayinVirtualAccountNumber
} from '$lib/server/domains/virtual-account/mappers/from-api/payin-van';

const DEFAULT_LIMIT = 10;

function emptyPagination(limit: number, page: number) {
	return { limit, page, total: 0 };
}

export const load: PageServerLoad = async ({ params, url, cookies, fetch, locals, depends }) => {
	depends('settlement-orders:list');
	requirePermission(locals.userPermissions, 'PAYINS', 'read');

	const settlementId = params.settlementId?.trim();
	if (!settlementId) error(404, 'Settlement not found');

	const log = locals.logger.child({ action: 'settlement-detail', settlementId });
	const limit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);
	const page = Math.floor(skip / limit);

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			error(401, e.message);
		}
		throw e;
	}

	const [headerResult, vanResult] = await Promise.all([
		settlementClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, {
			page: 1,
			limit: 20,
			search: settlementId
		}),
		resolvePayinVirtualAccountNumber(fetch, log, tokens.accessToken, tokens.gatewayToken)
	]);

	if (!headerResult.ok) {
		log.warn(
			{
				kind: headerResult.error.kind,
				message: headerResult.error.message
			},
			'GET merchant settlement by id failed'
		);
		error(
			headerResult.error.kind === 'http' ? (headerResult.error.status ?? 502) : 502,
			headerResult.error.message
		);
	}

	const item = headerResult.data.data.find((row) => row.settlementId === settlementId);
	if (!item) error(404, 'Settlement not found');

	const settlement = mapSettlementListItemToDetail(item);

	let orders: SettlementOrderRow[] = [];
	let ordersPagination = emptyPagination(limit, page);
	let ordersError: string | null = null;

	if (!vanResult.ok) {
		if (isNoPayinVirtualAccountError(vanResult.error)) {
			log.info('settlement detail — no PAYIN virtual account yet');
		} else {
			log.warn(
				{ kind: vanResult.error.kind, message: vanResult.error.message },
				'GET merchant PAYIN virtual account failed'
			);
			ordersError = vanResult.error.message;
		}
	} else {
		const ordersResult = await paymentAttemptClient.list(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			{
				settlementId,
				limit,
				page,
				virtualAccountNumber: vanResult.data
			}
		);

		if (!ordersResult.ok) {
			log.warn(
				{
					kind: ordersResult.error.kind,
					message: ordersResult.error.message
				},
				'GET settlement payment attempts failed'
			);
			ordersError = ordersResult.error.message;
		} else {
			orders = mapSettlementOrderRows(ordersResult.data.data);
			ordersPagination = ordersResult.data.pagination;
		}
	}

	return {
		settlement: {
			...settlement,
			transactionCount: ordersPagination.total
		},
		orders,
		ordersPagination,
		ordersError
	};
};
