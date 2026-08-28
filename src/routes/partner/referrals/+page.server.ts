import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { partnerReferralsClient } from '$lib/server/domains/partner-referrals/client';
import {
	buildReferralsStatusCounts,
	buildReferralsSummary,
	filterReferralsByEmail,
	filterReferralsByName,
	mapReferralMerchantsResponse,
	mapUiStatusToApiStatuses
} from '$lib/server/domains/partner-referrals/mappers/from-api/referral-merchants';
import type {
	ReferralMerchant,
	ReferralsStatusCounts,
	ReferralsSummary
} from '$lib/partner/referrals/types';
import { parseReferralBusinessType } from '$lib/partner/referrals/business-types';

const DEFAULT_LIMIT = 8;
const ALL_MERCHANTS_FETCH_LIMIT = 500;

function emptyStatusCounts(): ReferralsStatusCounts {
	return {
		all: 0,
		active: 0,
		pending: 0,
		inactive: 0,
		rejected: 0
	};
}

function emptySummary(): ReferralsSummary {
	return {
		totalReferrals: 0,
		activeMerchants: 0,
		pendingOnboarding: 0,
		totalCommission: 0
	};
}

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends }) => {
	depends('partner:referrals');

	const log = locals.logger.child({ action: 'partner-referrals' });
	const skip = Number(url.searchParams.get('skip')) || 0;
	const limit = Number(url.searchParams.get('limit')) || DEFAULT_LIMIT;
	const search = url.searchParams.get('search')?.trim() ?? '';
	const status = url.searchParams.get('status') ?? '';
	const businessType = parseReferralBusinessType(url.searchParams.get('type'));
	const searchField = url.searchParams.get('searchField') === 'email' ? 'email' : 'name';
	const apiPage = Math.floor(skip / limit);
	const apiStatuses = status ? mapUiStatusToApiStatuses(status) : undefined;
	const isNameSearch = searchField === 'name' && search.length > 0;
	const isEmailSearch = searchField === 'email' && search.length > 0;
	const isClientSideSearch = isNameSearch || isEmailSearch;

	const base = {
		referrals: {
			merchants: [] as ReferralMerchant[],
			allMerchants: [] as ReferralMerchant[],
			total: 0,
			statusCounts: emptyStatusCounts(),
			summary: emptySummary()
		},
		pagination: { limit, page: apiPage + 1, total: 0 },
		referralsError: null as string | null,
		clientSideSearch: isClientSideSearch
	};

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			return { ...base, referralsError: e.message };
		}
		throw e;
	}

	if (isClientSideSearch) {
		const searchResult = await partnerReferralsClient.listReferralMerchants(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			{
				page: 0,
				limit: ALL_MERCHANTS_FETCH_LIMIT,
				statuses: apiStatuses,
				businessType
			}
		);

		if (!searchResult.ok) {
			log.warn(
				{ kind: searchResult.error.kind, message: searchResult.error.message },
				'GET partner referral merchants failed'
			);
			return { ...base, referralsError: searchResult.error.message };
		}

		let merchants = mapReferralMerchantsResponse(
			searchResult.data,
			ALL_MERCHANTS_FETCH_LIMIT,
			0
		).merchants;

		if (isNameSearch) {
			merchants = filterReferralsByName(merchants, search);
		} else {
			merchants = filterReferralsByEmail(merchants, search);
		}

		const statusCounts = buildReferralsStatusCounts(merchants);

		return {
			referrals: {
				merchants,
				allMerchants: merchants,
				total: merchants.length,
				statusCounts,
				summary: buildReferralsSummary(merchants)
			},
			pagination: {
				limit,
				page: apiPage + 1,
				total: merchants.length
			},
			referralsError: null,
			clientSideSearch: true
		};
	}

	const [listResult, allResult] = await Promise.all([
		partnerReferralsClient.listReferralMerchants(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			{
				page: apiPage,
				limit,
				statuses: apiStatuses,
				businessType
			}
		),
		partnerReferralsClient.listReferralMerchants(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			{
				page: 0,
				limit: ALL_MERCHANTS_FETCH_LIMIT,
				businessType
			}
		)
	]);

	if (!listResult.ok) {
		log.warn(
			{ kind: listResult.error.kind, message: listResult.error.message },
			'GET partner referral merchants failed'
		);
		return { ...base, referralsError: listResult.error.message };
	}

	const mappedList = mapReferralMerchantsResponse(listResult.data, limit, apiPage);
	const merchants = mappedList.merchants;
	const pagination = mappedList.pagination;

	const allMerchants = allResult.ok
		? mapReferralMerchantsResponse(allResult.data, ALL_MERCHANTS_FETCH_LIMIT, 0).merchants
		: merchants;

	const statusCounts = buildReferralsStatusCounts(allMerchants);
	if (statusCounts.all === 0 && pagination.total > 0) {
		statusCounts.all = pagination.total;
	}

	return {
		referrals: {
			merchants,
			allMerchants,
			total: pagination.total,
			statusCounts,
			summary: buildReferralsSummary(allMerchants)
		},
		pagination,
		referralsError: null,
		clientSideSearch: false
	};
};
