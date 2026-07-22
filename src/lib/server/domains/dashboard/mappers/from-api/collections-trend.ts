import type { CollectionsTrendPoint } from '../../schema';
import { formatChartDate } from '$lib/utils/format-time';

export interface CollectionsTrendChartPoint {
	label: string;
	gross: number;
	net: number;
	transactionCount: number;
}

function formatTrendLabel(dateValue: string): string {
	const trimmed = dateValue.trim();
	if (!trimmed) return '—';

	if (/^week\s*\d+/i.test(trimmed)) {
		return trimmed;
	}

	return formatChartDate(trimmed);
}

export function mapCollectionsTrend(points: CollectionsTrendPoint[]): CollectionsTrendChartPoint[] {
	return points.map((point) => ({
		label: formatTrendLabel(point.date),
		gross: point.grossAmount,
		net: point.netAmount,
		transactionCount: point.transactionCount
	}));
}
