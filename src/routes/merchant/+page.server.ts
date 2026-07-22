import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { dashboardClient } from '$lib/server/domains/dashboard/client';
import {
	mapCollectionsTrend,
	type CollectionsTrendChartPoint
} from '$lib/server/domains/dashboard/mappers/from-api/collections-trend';
import {
	emptyConversionFunnel,
	mapConversionFunnel,
	type ConversionFunnelView
} from '$lib/server/domains/dashboard/mappers/from-api/conversion-funnel';
import {
	emptyDashboardKpis,
	mapDashboardKpis,
	type DashboardKpisView
} from '$lib/server/domains/dashboard/mappers/from-api/kpis';
import {
	mapPaymentMix,
	type PaymentMixChartItem
} from '$lib/server/domains/dashboard/mappers/from-api/payment-mix';
import { mapRecentTransactions } from '$lib/server/domains/dashboard/mappers/from-api/recent-transactions';
import { mapDashboardSettlements } from '$lib/server/domains/dashboard/mappers/from-api/settlements';
import type {
	DashboardKpiRange,
	DashboardTrendGranularity
} from '$lib/server/domains/dashboard/schema';
import { paymentAttemptClient } from '$lib/server/domains/payment-attempt/client';
import { settlementClient } from '$lib/server/domains/settlement/client';
import {
	isNoPayinVirtualAccountError,
	resolvePayinVirtualAccountNumber
} from '$lib/server/domains/virtual-account/mappers/from-api/payin-van';
import type {
	DashboardSettlement,
	DashboardTransaction
} from '$lib/components/merchant-dashboard/dashboard-data';

const VALID_RANGES = new Set<DashboardKpiRange>(['today', '7d', '30d']);
const VALID_GRANULARITIES = new Set<DashboardTrendGranularity>(['daily', 'weekly']);
const RECENT_LIMIT = 6;

function parseRange(value: string | null): DashboardKpiRange {
	if (value && VALID_RANGES.has(value as DashboardKpiRange)) {
		return value as DashboardKpiRange;
	}
	return '7d';
}

function parseGranularity(value: string | null): DashboardTrendGranularity {
	if (value && VALID_GRANULARITIES.has(value as DashboardTrendGranularity)) {
		return value as DashboardTrendGranularity;
	}
	return 'daily';
}

function formatDateParam(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function rangeToDateParams(range: DashboardKpiRange): { fromDate: string; toDate: string } {
	const toDate = new Date();
	const fromDate = new Date(toDate);

	if (range === 'today') {
		// keep same calendar day
	} else if (range === '7d') {
		fromDate.setDate(fromDate.getDate() - 6);
	} else {
		fromDate.setDate(fromDate.getDate() - 29);
	}

	return {
		fromDate: formatDateParam(fromDate),
		toDate: formatDateParam(toDate)
	};
}

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends }) => {
	depends('merchant:dashboard');

	const log = locals.logger.child({ action: 'merchant-dashboard' });
	const range = parseRange(url.searchParams.get('range'));
	const granularity = parseGranularity(url.searchParams.get('granularity'));
	const { fromDate, toDate } = rangeToDateParams(range);

	const base = {
		range,
		granularity,
		kpis: emptyDashboardKpis() as DashboardKpisView,
		kpisError: null as string | null,
		collectionsTrend: [] as CollectionsTrendChartPoint[],
		collectionsTrendError: null as string | null,
		paymentMix: [] as PaymentMixChartItem[],
		paymentMixError: null as string | null,
		conversionFunnel: emptyConversionFunnel() as ConversionFunnelView,
		conversionFunnelError: null as string | null,
		recentTransactions: [] as DashboardTransaction[],
		recentTransactionsError: null as string | null,
		recentTransactionsEmptyMessage: null as string | null,
		settlements: [] as DashboardSettlement[],
		settlementsError: null as string | null
	};

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			return {
				...base,
				kpisError: e.message,
				collectionsTrendError: e.message,
				paymentMixError: e.message,
				conversionFunnelError: e.message,
				recentTransactionsError: e.message,
				settlementsError: e.message
			};
		}
		throw e;
	}

	const vanResult = await resolvePayinVirtualAccountNumber(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken
	);

	const attemptsPromise = vanResult.ok
		? paymentAttemptClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, {
				fromDate,
				toDate,
				limit: RECENT_LIMIT,
				page: 0,
				virtualAccountNumber: vanResult.data
			})
		: Promise.resolve(null);

	const [
		kpisResult,
		trendResult,
		paymentMixResult,
		funnelResult,
		settlementsResult,
		attemptsResult
	] = await Promise.all([
		dashboardClient.getKpis(fetch, log, tokens.accessToken, tokens.gatewayToken, range),
		dashboardClient.getCollectionsTrend(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			range,
			granularity
		),
		dashboardClient.getPaymentMix(fetch, log, tokens.accessToken, tokens.gatewayToken, range),
		dashboardClient.getConversionFunnel(fetch, log, tokens.accessToken, tokens.gatewayToken, range),
		settlementClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, {
			page: 1,
			limit: RECENT_LIMIT,
			fromDate,
			toDate
		}),
		attemptsPromise
	]);

	let kpis = base.kpis;
	let kpisError: string | null = null;
	if (!kpisResult.ok) {
		log.warn(
			{
				kind: kpisResult.error.kind,
				message: kpisResult.error.message
			},
			'GET merchant dashboard kpis failed'
		);
		kpisError = kpisResult.error.message;
	} else {
		const kpiData = kpisResult.data.data[0];
		if (!kpiData) {
			kpisError = 'Dashboard KPIs response is empty';
		} else {
			kpis = mapDashboardKpis(kpiData);
		}
	}

	let collectionsTrend = base.collectionsTrend;
	let collectionsTrendError: string | null = null;
	if (!trendResult.ok) {
		log.warn(
			{
				kind: trendResult.error.kind,
				message: trendResult.error.message
			},
			'GET merchant dashboard collections-trend failed'
		);
		collectionsTrendError = trendResult.error.message;
	} else {
		collectionsTrend = mapCollectionsTrend(trendResult.data.data);
	}

	let paymentMix = base.paymentMix;
	let paymentMixError: string | null = null;
	if (!paymentMixResult.ok) {
		log.warn(
			{
				kind: paymentMixResult.error.kind,
				message: paymentMixResult.error.message
			},
			'GET merchant dashboard payment-mix failed'
		);
		paymentMixError = paymentMixResult.error.message;
	} else {
		const mixData = paymentMixResult.data.data[0];
		if (!mixData) {
			paymentMixError = 'Payment mix response is empty';
		} else {
			paymentMix = mapPaymentMix(mixData);
		}
	}

	let conversionFunnel = base.conversionFunnel;
	let conversionFunnelError: string | null = null;
	if (!funnelResult.ok) {
		log.warn(
			{
				kind: funnelResult.error.kind,
				message: funnelResult.error.message
			},
			'GET merchant dashboard conversion-funnel failed'
		);
		conversionFunnelError = funnelResult.error.message;
	} else {
		const funnelData = funnelResult.data.data[0];
		if (!funnelData) {
			conversionFunnelError = 'Conversion funnel response is empty';
		} else {
			conversionFunnel = mapConversionFunnel(funnelData);
		}
	}

	let recentTransactions = base.recentTransactions;
	let recentTransactionsError: string | null = null;
	let recentTransactionsEmptyMessage: string | null = null;
	if (!vanResult.ok) {
		if (isNoPayinVirtualAccountError(vanResult.error)) {
			log.info({ orgHint: 'no-payin-van' }, 'merchant dashboard — no PAYIN virtual account yet');
			recentTransactionsEmptyMessage = vanResult.error.message;
		} else {
			log.warn(
				{ kind: vanResult.error.kind, message: vanResult.error.message },
				'GET merchant PAYIN virtual account failed'
			);
			recentTransactionsError = vanResult.error.message;
		}
	} else if (!attemptsResult) {
		recentTransactionsError = 'Unable to load recent transactions';
	} else if (!attemptsResult.ok) {
		log.warn(
			{
				kind: attemptsResult.error.kind,
				message: attemptsResult.error.message
			},
			'GET merchant payment attempts for dashboard failed'
		);
		recentTransactionsError = attemptsResult.error.message;
	} else {
		recentTransactions = mapRecentTransactions(attemptsResult.data.data);
	}

	let settlements = base.settlements;
	let settlementsError: string | null = null;
	if (!settlementsResult.ok) {
		log.warn(
			{
				kind: settlementsResult.error.kind,
				message: settlementsResult.error.message
			},
			'GET merchant settlements for dashboard failed'
		);
		settlementsError = settlementsResult.error.message;
	} else {
		settlements = mapDashboardSettlements(settlementsResult.data.data);
	}

	return {
		range,
		granularity,
		kpis,
		kpisError,
		collectionsTrend,
		collectionsTrendError,
		paymentMix,
		paymentMixError,
		conversionFunnel,
		conversionFunnelError,
		recentTransactions,
		recentTransactionsError,
		recentTransactionsEmptyMessage,
		settlements,
		settlementsError
	};
};
