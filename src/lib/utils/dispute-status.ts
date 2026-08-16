import { formatSnakeCaseLabel } from '$lib/utils/format-display';

export const DISPUTE_STATUS_FILTERS = [
	{ value: 'DISPUTE_RAISED', label: 'Raised' },
	{ value: 'DISPUTE_OPEN', label: 'Open' },
	{ value: 'DISPUTE_UNDER_REVIEW', label: 'Under review' },
	{ value: 'DISPUTE_WON', label: 'Won' },
	{ value: 'DISPUTE_LOST', label: 'Lost' }
] as const;

export const DISPUTE_SOURCE_FILTERS = [
	{ value: 'AGGREGATOR_MANUAL', label: 'Aggregator manual' },
	{ value: 'BANK_MANUAL', label: 'Bank manual' }
] as const;

export type DisputeStatusChipVariant =
	'warning' | 'info' | 'alert' | 'success' | 'error' | 'outline';

function normalizeDisputeStatusKey(status: string): string {
	return status
		.trim()
		.toUpperCase()
		.replace(/^DISPUTE_/, '')
		.replace(/\s+/g, '_');
}

export function formatDisputeStatusLabel(status: string): string {
	const normalized = normalizeDisputeStatusKey(status);
	if (!normalized) return '—';

	const labels: Record<string, string> = {
		RAISED: 'Raised',
		OPEN: 'Open',
		UNDER_REVIEW: 'Under review',
		WON: 'Won',
		LOST: 'Lost'
	};

	return labels[normalized] ?? formatSnakeCaseLabel(status);
}

export function disputeStatusChipVariant(status: string): DisputeStatusChipVariant {
	const normalized = normalizeDisputeStatusKey(status);

	if (normalized === 'RAISED') return 'warning';
	if (normalized === 'OPEN') return 'info';
	if (normalized === 'UNDER_REVIEW') return 'alert';
	if (normalized === 'WON') return 'success';
	if (normalized === 'LOST') return 'error';
	return 'outline';
}
