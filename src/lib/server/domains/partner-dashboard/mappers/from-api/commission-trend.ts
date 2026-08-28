import type { CommissionTrendPoint } from '../../schema';
import { formatChartDate } from '$lib/utils/format-time';

export interface CommissionTrendChartPoint {
	label: string;
	value: number;
}

function formatTrendLabel(dateValue: string): string {
	const trimmed = dateValue.trim();
	if (!trimmed) return '—';
	return formatChartDate(trimmed);
}

export function mapCommissionTrend(points: CommissionTrendPoint[]): CommissionTrendChartPoint[] {
	return points.map((point) => ({
		label: formatTrendLabel(point.date),
		value: point.commissionAmount
	}));
}
