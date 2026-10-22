import type { PageServerLoad } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { partnerDashboardClient } from '$lib/server/domains/partner-dashboard/client';
import {
	emptyPartnerKpis,
	mapPartnerKpis,
	type PartnerKpiView
} from '$lib/server/domains/partner-dashboard/mappers/from-api/kpis';
import {
	mapCommissionTrend,
	type CommissionTrendChartPoint
} from '$lib/server/domains/partner-dashboard/mappers/from-api/commission-trend';
import {
	emptyCommissionChart,
	mapCommissionChart
} from '$lib/server/domains/partner-dashboard/mappers/from-api/commission-chart';
import type { PaymentMixItem } from '$lib/components/merchant-dashboard';
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
	depends('partner:dashboard');

	const log = locals.logger.child({ action: 'partner-dashboard' });
	const range = parseRange(url.searchParams.get('range'));
	const granularity = parseGranularity(url.searchParams.get('granularity'));

	const base = {
		range,
		granularity,
		kpis: emptyPartnerKpis() as PartnerKpiView[],
		kpisError: null as string | null,
		commissionTrend: [] as CommissionTrendChartPoint[],
		commissionTrendError: null as string | null,
		commissionChart: emptyCommissionChart() as PaymentMixItem[],
		commissionChartError: null as string | null
	};

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			return {
				...base,
				kpisError: e.message,
				commissionTrendError: e.message,
				commissionChartError: e.message
			};
		}
		throw e;
	}

	const [kpisResult, trendResult, chartResult] = await Promise.all([
		partnerDashboardClient.getKpis(fetch, log, tokens.accessToken, tokens.gatewayToken, range),
		partnerDashboardClient.getCommissionTrend(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			range,
			granularity
		),
		partnerDashboardClient.getCommissionChart(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			range
		)
	]);

	let kpis = base.kpis;
	let kpisError: string | null = null;
	if (!kpisResult.ok) {
		log.warn(
			{ kind: kpisResult.error.kind, message: kpisResult.error.message },
			'GET partner dashboard kpis failed'
		);
		kpisError = kpisResult.error.message;
	} else {
		const kpiData = kpisResult.data.data[0];
		if (!kpiData) {
			kpisError = 'Dashboard KPIs response is empty';
		} else {
			kpis = mapPartnerKpis(kpiData);
		}
	}

	let commissionTrend = base.commissionTrend;
	let commissionTrendError: string | null = null;
	if (!trendResult.ok) {
		log.warn(
			{ kind: trendResult.error.kind, message: trendResult.error.message },
			'GET partner dashboard commission trend failed'
		);
		commissionTrendError = trendResult.error.message;
	} else {
		commissionTrend = mapCommissionTrend(trendResult.data.data);
	}

	let commissionChart = base.commissionChart;
	let commissionChartError: string | null = null;
	if (!chartResult.ok) {
		log.warn(
			{ kind: chartResult.error.kind, message: chartResult.error.message },
			'GET partner dashboard commission chart failed'
		);
		commissionChartError = chartResult.error.message;
	} else {
		const chartData = chartResult.data.data[0];
		if (!chartData) {
			commissionChartError = 'Commission chart response is empty';
		} else {
			commissionChart = mapCommissionChart(chartData);
		}
	}

	return {
		range,
		granularity,
		kpis,
		kpisError,
		commissionTrend,
		commissionTrendError,
		commissionChart,
		commissionChartError
	};
};
