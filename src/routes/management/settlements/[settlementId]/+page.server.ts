import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { settlementClient } from '$lib/server/domains/settlement/client';
import { mapManagementSettlementListItemToDetail } from '$lib/server/domains/settlement/mappers/from-api/list';
import { mapSettlementDetailsResponse } from '$lib/server/domains/settlement/mappers/from-api/details';
import type { SettlementDetail } from '../types';

const DEFAULT_LIMIT = 10;

function resolveOrgId(
	raw: string | null,
	merchantOptions: { value: string; label: string }[]
): string | undefined {
	if (!raw) return undefined;
	return merchantOptions.some((merchant) => merchant.value === raw) ? raw : undefined;
}

function emptyPagination(limit: number, page: number) {
	return { limit, page, total: 0 };
}

export const load: PageServerLoad = async ({
	params,
	url,
	cookies,
	fetch,
	locals,
	depends,
	parent
}) => {
	depends('management-settlement:details');

	const parentData = await parent();
	const settlementId = params.settlementId?.trim();
	if (!settlementId) error(404, 'Settlement not found');

	const log = locals.logger.child({ action: 'management-settlement-detail', settlementId });
	const orgId = resolveOrgId(url.searchParams.get('merchantId'), parentData.merchantOptions);
	const skip = Number(url.searchParams.get('skip')) || 0;
	const limit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const page = Math.floor(skip / limit) + 1;

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			error(401, e.message);
		}
		throw e;
	}

	const [headerResult, detailsResult] = await Promise.all([
		settlementClient.list(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			{
				page: 1,
				limit: 20,
				search: settlementId,
				orgId
			},
			'management'
		),
		settlementClient.getDetails(fetch, log, tokens.accessToken, tokens.gatewayToken, settlementId, {
			page,
			limit
		})
	]);

	if (!headerResult.ok) {
		log.warn(
			{
				kind: headerResult.error.kind,
				message: headerResult.error.message
			},
			'GET management settlement header failed'
		);
		error(
			headerResult.error.kind === 'http' ? (headerResult.error.status ?? 502) : 502,
			headerResult.error.message
		);
	}

	const item = headerResult.data.data.find((row) => row.settlementId === settlementId);
	if (!item) error(404, 'Settlement not found');

	const header = mapManagementSettlementListItemToDetail(item);
	let detailsPagination = emptyPagination(limit, page);
	let detailsError: string | null = null;

	let settlement: SettlementDetail = header;

	if (!detailsResult.ok) {
		log.warn(
			{
				kind: detailsResult.error.kind,
				message: detailsResult.error.message
			},
			'GET management settlement details failed'
		);
		detailsError = detailsResult.error.message;
	} else {
		const transactions = mapSettlementDetailsResponse(detailsResult.data.data);
		detailsPagination = detailsResult.data.pagination;
		settlement = {
			...header,
			transactions,
			orderStats: {
				orders: detailsPagination.total,
				successful: transactions.filter((t) => t.type === 'sale').length,
				pending: 0,
				created: 0,
				failed: 0
			}
		};
	}

	return {
		settlement,
		detailsPagination,
		detailsError
	};
};
