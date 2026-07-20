import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { settlementClient } from '$lib/server/domains/settlement/client';
import {
	mapSettlementOverview,
	type SettlementOverviewView
} from '$lib/server/domains/settlement/mappers/from-api/overview';
import {
	mapSettlementListResponse,
	mapUiStatusToApi,
	type SettlementListRow
} from '$lib/server/domains/settlement/mappers/from-api/list';
import { accountSettlementConfig } from '$lib/data/settlement-mock';

const DEFAULT_LIMIT = 10;

function emptyOverview(): SettlementOverviewView {
	return {
		totalSettledAmount: '—',
		awaitingSettlementAmount: '—',
		lastSettlement: null
	};
}

function emptyPagination(limit: number, page: number) {
	return { limit, page, total: 0 };
}

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends }) => {
	depends('settlements:list');

	const log = locals.logger.child({ action: 'settlements-page' });
	const skip = Number(url.searchParams.get('skip')) || 0;
	const limit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const page = Math.floor(skip / limit) + 1;
	const search = url.searchParams.get('search')?.trim() ?? '';
	const uiStatus = url.searchParams.get('status')?.trim() || undefined;
	const fromDate = url.searchParams.get('fromDate')?.trim() || undefined;
	const toDate = url.searchParams.get('toDate')?.trim() || undefined;
	const apiStatus = mapUiStatusToApi(uiStatus);

	const base = {
		accountSettlementConfig,
		settlements: [] as SettlementListRow[],
		pagination: emptyPagination(limit, page)
	};

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			return {
				...base,
				overview: emptyOverview(),
				overviewError: e.message,
				listError: e.message
			};
		}
		throw e;
	}

	const [overviewResult, listResult] = await Promise.all([
		settlementClient.getOverview(fetch, log, tokens.accessToken, tokens.gatewayToken),
		settlementClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, {
			page,
			limit,
			status: apiStatus,
			fromDate,
			toDate,
			search: search || undefined
		})
	]);

	let overview = emptyOverview();
	let overviewError: string | null = null;
	if (!overviewResult.ok) {
		log.warn(
			{
				kind: overviewResult.error.kind,
				message: overviewResult.error.message
			},
			'GET merchant settlements overview failed'
		);
		overviewError = overviewResult.error.message;
	} else {
		const overviewData = overviewResult.data.data[0];
		overview = overviewData ? mapSettlementOverview(overviewData) : emptyOverview();
		if (!overviewData) {
			overviewError = 'Settlement overview is empty';
		}
	}

	let settlements: SettlementListRow[] = [];
	let pagination = emptyPagination(limit, page);
	let listError: string | null = null;
	if (!listResult.ok) {
		log.warn(
			{
				kind: listResult.error.kind,
				message: listResult.error.message
			},
			'GET merchant settlements list failed'
		);
		listError = listResult.error.message;
	} else {
		settlements = mapSettlementListResponse(listResult.data.data);
		pagination = listResult.data.pagination;
	}

	return {
		accountSettlementConfig,
		overview,
		overviewError,
		settlements,
		pagination,
		listError
	};
};
