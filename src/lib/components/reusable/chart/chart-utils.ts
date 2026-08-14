export type ChartColorToken = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5';

export const CHART_COLOR_TOKENS: ChartColorToken[] = [
	'chart-1',
	'chart-2',
	'chart-3',
	'chart-4',
	'chart-5'
];

export const chartFillClass: Record<ChartColorToken, string> = {
	'chart-1': 'fill-chart-1',
	'chart-2': 'fill-chart-2',
	'chart-3': 'fill-chart-3',
	'chart-4': 'fill-chart-4',
	'chart-5': 'fill-chart-5'
};

export const chartStrokeClass: Record<ChartColorToken, string> = {
	'chart-1': 'stroke-chart-1',
	'chart-2': 'stroke-chart-2',
	'chart-3': 'stroke-chart-3',
	'chart-4': 'stroke-chart-4',
	'chart-5': 'stroke-chart-5'
};

export const chartBgClass: Record<ChartColorToken, string> = {
	'chart-1': 'bg-chart-1',
	'chart-2': 'bg-chart-2',
	'chart-3': 'bg-chart-3',
	'chart-4': 'bg-chart-4',
	'chart-5': 'bg-chart-5'
};

export interface ChartPoint {
	label: string;
	value: number;
}

export interface DonutSegment {
	label: string;
	value: number;
	color?: ChartColorToken;
}

export function buildAreaPaths(
	points: ChartPoint[],
	width: number,
	height: number,
	padding = 4
): { area: string; line: string; coords: { x: number; y: number }[] } {
	if (points.length === 0) {
		return { area: '', line: '', coords: [] };
	}

	const values = points.map((p) => p.value);
	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min || 1;
	const innerWidth = width - padding * 2;
	const innerHeight = height - padding * 2;

	const coords = points.map((point, index) => {
		const x =
			padding + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
		const y = padding + innerHeight - ((point.value - min) / range) * innerHeight;
		return { x, y };
	});

	const line = coords
		.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
		.join(' ');
	const area = `${line} L ${coords[coords.length - 1].x.toFixed(2)} ${height - padding} L ${coords[0].x.toFixed(2)} ${height - padding} Z`;

	return { area, line, coords };
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
	const rad = ((angleDeg - 90) * Math.PI) / 180;
	return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export function describeDonutSegment(
	cx: number,
	cy: number,
	outerRadius: number,
	innerRadius: number,
	startAngle: number,
	endAngle: number
): string {
	const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
	const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
	const startInner = polarToCartesian(cx, cy, innerRadius, endAngle);
	const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);
	const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

	return [
		`M ${startOuter.x.toFixed(2)} ${startOuter.y.toFixed(2)}`,
		`A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${endOuter.x.toFixed(2)} ${endOuter.y.toFixed(2)}`,
		`L ${endInner.x.toFixed(2)} ${endInner.y.toFixed(2)}`,
		`A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${startInner.x.toFixed(2)} ${startInner.y.toFixed(2)}`,
		'Z'
	].join(' ');
}

export function buildDonutSegments(
	segments: DonutSegment[],
	size: number,
	innerRadiusRatio = 0.62
): { path: string; color: ChartColorToken; label: string; value: number; percent: number }[] {
	const total = segments.reduce((sum, segment) => sum + segment.value, 0);
	if (total === 0) return [];

	const cx = size / 2;
	const cy = size / 2;
	const outerRadius = size / 2 - 2;
	const innerRadius = outerRadius * innerRadiusRatio;
	let cursor = 0;

	return segments.map((segment, index) => {
		const sweep = (segment.value / total) * 360;
		const startAngle = cursor;
		const endAngle = cursor + sweep;
		cursor = endAngle;

		return {
			path: describeDonutSegment(cx, cy, outerRadius, innerRadius, startAngle, endAngle),
			color: segment.color ?? CHART_COLOR_TOKENS[index % CHART_COLOR_TOKENS.length],
			label: segment.label,
			value: segment.value,
			percent: (segment.value / total) * 100
		};
	});
}
