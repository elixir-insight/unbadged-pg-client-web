import { formatSnakeCaseLabel } from '$lib/utils/format-display';

export const DISPUTE_STATUSES = [
	{
		value: 'DISPUTE_RAISED',
		label: 'Raised',
		description: 'The dispute has just been raised.',
		variant: 'warning'
	},
	{
		value: 'AWAITING_MERCHANT_PROOF',
		label: 'Awaiting merchant proof',
		description: 'The dispute is awaiting proof from the merchant.',
		variant: 'warning'
	},
	{
		value: 'PROOF_SUBMITTED',
		label: 'Proof submitted',
		description: 'The merchant has submitted proof.',
		variant: 'info'
	},
	{
		value: 'GATEWAY_DOCUMENT_UNDER_REVIEW',
		label: 'Gateway document under review',
		description: 'The submitted proof is under review by the gateway.',
		variant: 'alert'
	},
	{
		value: 'PIPELINE_DOCUMENT_UNDER_REVIEW',
		label: 'Pipeline document under review',
		description: 'The submitted proof is under review by the pipeline.',
		variant: 'alert'
	},
	{
		value: 'PROOF_REJECTED',
		label: 'Proof rejected',
		description: 'The submitted proof was rejected.',
		variant: 'error'
	},
	{
		value: 'SENT_TO_AGGREGATOR',
		label: 'Sent to aggregator',
		description: 'The dispute has been sent to the aggregator.',
		variant: 'info'
	},
	{
		value: 'RESOLVED_WON',
		label: 'Resolved won',
		description: "The dispute was resolved in the merchant's favor.",
		variant: 'success'
	},
	{
		value: 'RESOLVED_LOST',
		label: 'Resolved lost',
		description: 'The dispute was resolved against the merchant.',
		variant: 'error'
	},
	{
		value: 'CLOSED_OTHER',
		label: 'Closed other',
		description: 'The dispute was closed for a reason other than a win/loss resolution.',
		variant: 'outline'
	},
	{
		value: 'CHARGEBACK_LOST_PENDING_DECISION',
		label: 'Chargeback lost pending decision',
		description: 'The customer won round 1 and the merchant is deciding whether to re-represent.',
		variant: 'warning'
	},
	{
		value: 'RE_REPRESENTMENT_SUBMITTED',
		label: 'Re-representment submitted',
		description: 'The merchant has submitted re-representment evidence.',
		variant: 'info'
	},
	{
		value: 'PRE_ARBITRATION',
		label: 'Pre-arbitration',
		description: 'The dispute has escalated to pre-arbitration.',
		variant: 'alert'
	},
	{
		value: 'ARBITRATION_LOST',
		label: 'Arbitration lost',
		description: 'The dispute was lost at arbitration.',
		variant: 'error'
	},
	{
		value: 'MERCHANT_ACCEPTED_DISPUTE',
		label: 'Merchant accepted dispute',
		description: 'The merchant has accepted the dispute and is ready to pay the chargeback amount.',
		variant: 'outline'
	}
] as const;

export const DISPUTE_STATUS_FILTERS = DISPUTE_STATUSES.map((status) => ({
	value: status.value,
	label: status.label
}));

export const DISPUTE_SOURCE_FILTERS = [
	{ value: 'AGGREGATOR_MANUAL', label: 'Aggregator manual' },
	{ value: 'BANK_MANUAL', label: 'Bank manual' }
] as const;

export type DisputeStatusChipVariant =
	'warning' | 'info' | 'alert' | 'success' | 'error' | 'outline';

export interface DisputeTimelineEventView {
	id: string;
	status: string;
	title: string;
	description: string;
	date: string;
}

type DisputeStatusDefinition = (typeof DISPUTE_STATUSES)[number];

const STATUS_BY_VALUE = new Map<string, DisputeStatusDefinition>(
	DISPUTE_STATUSES.map((status) => [status.value, status])
);

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

	const match = STATUS_BY_VALUE.get(trimmed.toUpperCase());
	if (match) return match.label;

	const labels: Record<string, string> = {
		RAISED: 'Raised',
		OPEN: 'Open',
		UNDER_REVIEW: 'Under review',
		WON: 'Won',
		LOST: 'Lost'
	};

	return labels[normalizeDisputeStatusKey(trimmed)] ?? formatSnakeCaseLabel(trimmed);
}

export function disputeStatusDescription(status: string): string {
	const match = STATUS_BY_VALUE.get(status.trim().toUpperCase());
	return match?.description ?? '';
}

export function disputeStatusChipVariant(status: string): DisputeStatusChipVariant {
	const match = STATUS_BY_VALUE.get(status.trim().toUpperCase());
	if (match) return match.variant;

	const normalized = normalizeDisputeStatusKey(status);
	if (normalized === 'RAISED') return 'warning';
	if (normalized === 'OPEN') return 'info';
	if (normalized === 'UNDER_REVIEW') return 'alert';
	if (normalized === 'WON') return 'success';
	if (normalized === 'LOST') return 'error';
	return 'outline';
}

export function disputeCurrentStage(status: string): string {
	return formatDisputeStatusLabel(status);
}

export function disputeTimelineStep(status: string): number {
	const key = status.trim().toUpperCase();
	if (key === 'DISPUTE_RAISED' || normalizeDisputeStatusKey(status) === 'RAISED') return 0;
	if (
		key === 'AWAITING_MERCHANT_PROOF' ||
		key === 'PROOF_SUBMITTED' ||
		normalizeDisputeStatusKey(status) === 'OPEN'
	) {
		return 3;
	}
	if (
		key === 'GATEWAY_DOCUMENT_UNDER_REVIEW' ||
		key === 'PIPELINE_DOCUMENT_UNDER_REVIEW' ||
		key === 'SENT_TO_AGGREGATOR' ||
		key === 'PRE_ARBITRATION' ||
		key === 'RE_REPRESENTMENT_SUBMITTED' ||
		key === 'CHARGEBACK_LOST_PENDING_DECISION' ||
		normalizeDisputeStatusKey(status) === 'UNDER_REVIEW'
	) {
		return 4;
	}
	if (
		key === 'RESOLVED_WON' ||
		key === 'RESOLVED_LOST' ||
		key === 'CLOSED_OTHER' ||
		key === 'ARBITRATION_LOST' ||
		key === 'MERCHANT_ACCEPTED_DISPUTE' ||
		key === 'PROOF_REJECTED' ||
		normalizeDisputeStatusKey(status) === 'WON' ||
		normalizeDisputeStatusKey(status) === 'LOST'
	) {
		return 5;
	}
	return 0;
}
