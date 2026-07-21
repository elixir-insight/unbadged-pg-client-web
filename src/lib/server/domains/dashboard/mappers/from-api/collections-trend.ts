import type { CollectionsTrendPoint } from '../../schema';

export interface CollectionsTrendChartPoint {
	label: string;
	gross: number;
	net: number;
	transactionCount: number;
}

function formatTrendLabel(dateValue: string): string {
	const trimmed = dateValue.trim();
	if (!trimmed) return '—';

	// Prefer calendar date from ISO strings to avoid timezone day-shifts.
	const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
	if (isoDate) {
		return `${isoDate[2]}-${isoDate[3]}`;
	}

	const parsed = new Date(trimmed);
	if (!Number.isNaN(parsed.getTime())) {
		const month = String(parsed.getMonth() + 1).padStart(2, '0');
		const day = String(parsed.getDate()).padStart(2, '0');
		return `${month}-${day}`;
	}

	// Already short labels like 06-22 or Week 1.
	if (/^\d{2}-\d{2}$/.test(trimmed) || /^week\s*\d+/i.test(trimmed)) {
		return trimmed;
	}

	return trimmed;
}

export function mapCollectionsTrend(points: CollectionsTrendPoint[]): CollectionsTrendChartPoint[] {
	return points.map((point) => ({
		label: formatTrendLabel(point.date),
		gross: point.grossAmount,
		net: point.netAmount,
		transactionCount: point.transactionCount
	}));
}
