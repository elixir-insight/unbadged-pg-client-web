import type { CardDataTrend } from '$lib/components/reusable';
import type {
	ChartColorToken,
	ChartPoint,
	DonutSegment
} from '$lib/components/reusable/chart/chart-utils';

export type DashboardKpi = {
	label: string;
	value: string;
	subText?: string;
	trend?: CardDataTrend;
	trendLabel?: string;
};

export type DashboardAreaChart = {
	title: string;
	description?: string;
	color?: ChartColorToken;
	data: ChartPoint[];
	emptyMessage?: string;
};

export type DashboardDonutChart = {
	centerLabel?: string;
	centerValue?: string;
	segments: DonutSegment[];
	emptyMessage?: string;
};

export type FetchDashboardSummaryResponse = {
	kpis: DashboardKpi[];
	commissionTrend: DashboardAreaChart;
	volumeByPaymentMethod: DashboardDonutChart;
	referralVolumeTrend: DashboardAreaChart;
	merchantsByStatus: DashboardDonutChart;
};
