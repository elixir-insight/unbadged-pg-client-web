import { formatSnakeCaseLabel } from '$lib/utils/format-display';

export const DISPUTE_SOURCE_FILTERS = [
	{ value: 'AGGREGATOR_MANUAL', label: 'Aggregator manual' },
	{ value: 'BANK_MANUAL', label: 'Bank manual' }
] as const;

export type DisputeStatusChipVariant =
	'warning' | 'info' | 'alert' | 'success' | 'error' | 'outline';

export interface DisputeStatusOption {
	value: string;
	label: string;
	description: string;
}

export interface DisputeTimelineEventView {
	id: string;
	status: string;
	title: string;
	description: string;
	date: string;
}

function normalizeDisputeStatusKey(status: string): string {
	return status
		.trim()
		.toUpperCase()
		.replace(/^DISPUTE_/, '')
		.replace(/\s+/g, '_');
}

export function formatDisputeStatusLabel(status: string): string {
	const trimmed = status.trim();
	if (!trimmed) return '—';

	const labels: Record<string, string> = {
		RAISED: 'Raised',
		OPEN: 'Open',
		UNDER_REVIEW: 'Under review',
		WON: 'Won',
		LOST: 'Lost'
	};

	const normalized = normalizeDisputeStatusKey(trimmed);
	return labels[normalized] ?? formatSnakeCaseLabel(normalized);
}

export function findDisputeStatus(
	status: string,
	catalog: DisputeStatusOption[]
): DisputeStatusOption | undefined {
	const key = status.trim().toUpperCase();
	if (!key) return undefined;
	return catalog.find((item) => item.value.toUpperCase() === key);
}

export function disputeStatusLabel(status: string, catalog: DisputeStatusOption[] = []): string {
	return findDisputeStatus(status, catalog)?.label ?? formatDisputeStatusLabel(status);
}

export function disputeStatusDescription(
	status: string,
	catalog: DisputeStatusOption[] = []
): string {
	return findDisputeStatus(status, catalog)?.description ?? '';
}

export function disputeStatusChipVariant(status: string): DisputeStatusChipVariant {
	const normalized = normalizeDisputeStatusKey(status);

	if (normalized.includes('WON')) return 'success';
	if (normalized.includes('REJECTED') || normalized.includes('LOST')) return 'error';
	if (normalized.includes('UNDER_REVIEW') || normalized.includes('ARBITRATION')) return 'alert';
	if (normalized.includes('SUBMITTED') || normalized.includes('SENT_TO')) return 'info';
	if (normalized.includes('RAISED') || normalized.includes('AWAITING')) return 'warning';
	if (normalized.includes('PENDING')) return 'warning';
	return 'outline';
}

export function disputeCurrentStage(status: string, catalog: DisputeStatusOption[] = []): string {
	return disputeStatusLabel(status, catalog);
}

export function disputeTimelineStep(status: string): number {
	const normalized = normalizeDisputeStatusKey(status);
	if (normalized === 'RAISED') return 0;
	if (normalized === 'OPEN') return 3;
	if (normalized === 'UNDER_REVIEW') return 4;
	if (normalized === 'WON' || normalized === 'LOST') return 5;
	return 0;
}

export function paymentDisputeActionLabel(status: string): string {
	const normalized = normalizeDisputeStatusKey(status);
	if (normalized.includes('WON')) return 'Dispute won';
	if (normalized.includes('LOST')) return 'Dispute lost';
	return 'Dispute raised';
}
