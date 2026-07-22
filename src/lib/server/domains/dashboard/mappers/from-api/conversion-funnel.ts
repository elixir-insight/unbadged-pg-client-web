import type { ConversionFunnelData } from '../../schema';

export interface ConversionFunnelStageView {
	label: string;
	count: number;
	percentage: number;
	change: number | null;
}

export interface ConversionFunnelOutcomeView {
	label: string;
	count: number;
}

export interface ConversionFunnelView {
	stages: ConversionFunnelStageView[];
	outcomes: ConversionFunnelOutcomeView[];
	overallConversionRate: number;
	overallConversionRateChange: number;
}

const STAGE_LABELS: Record<string, string> = {
	created: 'Created',
	initiated: 'Initiated',
	authorized: 'Authorized',
	captured: 'Captured',
	settled: 'Settled'
};

const TERMINAL_LABELS: Record<string, string> = {
	failed: 'Failed',
	expired: 'Expired',
	cancelled: 'Cancelled',
	canceled: 'Cancelled',
	declined: 'Declined',
	abandoned: 'Abandoned'
};

const FUNNEL_STAGE_IDS = new Set(Object.keys(STAGE_LABELS));

function normalizeId(id: string): string {
	return id
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, '_');
}

function formatLabel(id: string, known: Record<string, string>): string {
	const normalized = normalizeId(id);
	const mapped = known[normalized];
	if (mapped) return mapped;

	return id
		.trim()
		.replace(/[_-]+/g, ' ')
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

function toPercentage(value: number): number {
	if (!Number.isFinite(value)) return 0;
	const normalized = value >= 0 && value <= 1 ? value * 100 : value;
	return Number(Math.max(0, Math.min(100, normalized)).toFixed(1));
}

function toDropOffChange(dropOffRate: number, isFirstStage: boolean): number | null {
	if (isFirstStage) return null;
	const normalized = dropOffRate >= 0 && dropOffRate <= 1 ? dropOffRate * 100 : dropOffRate;
	const rounded = Number(Math.abs(normalized).toFixed(1));
	if (rounded === 0) return 0;
	return -rounded;
}

export function mapConversionFunnel(data: ConversionFunnelData): ConversionFunnelView {
	const stages = data.stages.map((stage, index) => ({
		label: formatLabel(stage.id, STAGE_LABELS),
		count: Math.round(stage.count),
		percentage: toPercentage(stage.conversionRate),
		change: toDropOffChange(stage.dropOffRate, index === 0)
	}));

	const outcomes = data.terminalStatuses
		.filter((status) => {
			const normalized = normalizeId(status.id);
			return !FUNNEL_STAGE_IDS.has(normalized) && status.count > 0;
		})
		.map((status) => ({
			label: formatLabel(status.id, TERMINAL_LABELS),
			count: Math.round(status.count)
		}));

	return {
		stages,
		outcomes,
		overallConversionRate: toPercentage(data.overallConversionRate),
		overallConversionRateChange: Number(data.overallConversionRateChange.toFixed(1))
	};
}

export function emptyConversionFunnel(): ConversionFunnelView {
	return {
		stages: [],
		outcomes: [],
		overallConversionRate: 0,
		overallConversionRateChange: 0
	};
}
