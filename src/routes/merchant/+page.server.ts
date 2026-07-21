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
import type {
	DashboardKpiRange,
	DashboardTrendGranularity
} from '$lib/server/domains/dashboard/schema';

const VALID_RANGES = new Set<DashboardKpiRange>(['today', '7d', '30d']);
const VALID_GRANULARITIES = new Set<DashboardTrendGranularity>(['daily', 'weekly']);

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

export const load: PageServerLoad = async ({ url, cookies, fetch, locals, depends }) => {
	depends('merchant:dashboard');

	const log = locals.logger.child({ action: 'merchant-dashboard' });
	const range = parseRange(url.searchParams.get('range'));
	const granularity = parseGranularity(url.searchParams.get('granularity'));

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
		conversionFunnelError: null as string | null
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
				conversionFunnelError: e.message
			};
		}
		throw e;
	}

	const [kpisResult, trendResult, paymentMixResult, funnelResult] = await Promise.all([
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
		dashboardClient.getConversionFunnel(fetch, log, tokens.accessToken, tokens.gatewayToken, range)
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
		conversionFunnelError
	};
};
