import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { settlementClient } from '$lib/server/domains/settlement/client';
import {
	mapManagementSettlementListResponse,
	mapUiStatusToApi,
	type ManagementSettlementListRow
} from '$lib/server/domains/settlement/mappers/from-api/list';

const DEFAULT_LIMIT = 10;

function resolveOrgId(
	raw: string | null,
	merchantOptions: { value: string; label: string }[]
): string {
	if (raw && merchantOptions.some((merchant) => merchant.value === raw)) return raw;
	return merchantOptions[0]?.value ?? '';
}

function emptyPagination(limit: number, page: number) {
	return { limit, page, total: 0 };
}

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends, parent }) => {
	depends('management-settlements:list');
	requirePermission(locals.userPermissions, 'PAYINS', 'read');

	const parentData = await parent();
	const log = locals.logger.child({ action: 'management-settlements-list' });
	const skip = Number(url.searchParams.get('skip')) || 0;
	const limit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const page = Math.floor(skip / limit) + 1;
	const search = url.searchParams.get('search')?.trim() ?? '';
	const uiStatus = url.searchParams.get('status')?.trim() || undefined;
	const dateParam = url.searchParams.get('date')?.trim();
	const fromDate =
		dateParam && dateParam !== 'none'
			? dateParam
			: url.searchParams.get('fromDate')?.trim() || undefined;
	const toDate =
		dateParam && dateParam !== 'none'
			? dateParam
			: url.searchParams.get('toDate')?.trim() || undefined;
	const orgId = resolveOrgId(url.searchParams.get('merchantId'), parentData.merchantOptions);
	const apiStatus = mapUiStatusToApi(uiStatus);

	const empty = {
		settlements: [] as ManagementSettlementListRow[],
		pagination: emptyPagination(limit, page),
		orgId,
		listError: null as string | null
	};

	if (!orgId) {
		return {
			...empty,
			listError: parentData.merchantsError ?? 'No merchants are available.'
		};
	}

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			return { ...empty, listError: e.message };
		}
		throw e;
	}

	const result = await settlementClient.list(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		{
			page,
			limit,
			status: apiStatus,
			fromDate,
			toDate,
			search: search || undefined,
			orgId
		},
		'management'
	);

	if (!result.ok) {
		log.warn(
			{
				kind: result.error.kind,
				message: result.error.message
			},
			'GET management settlements list failed'
		);
		return { ...empty, listError: result.error.message };
	}

	return {
		settlements: mapManagementSettlementListResponse(result.data.data),
		pagination: result.data.pagination,
		orgId,
		listError: null
	};
};
