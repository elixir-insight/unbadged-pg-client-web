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

/** Terminal outcomes should not render as a pending/current timeline step. */
export function isDisputeTimelineTerminalStatus(status: string): boolean {
	const normalized = normalizeDisputeStatusKey(status);
	return (
		normalized.includes('WON') ||
		normalized.includes('LOST') ||
		normalized.includes('RESOLVED') ||
		normalized.includes('REJECTED') ||
		normalized.includes('ACCEPTED') ||
		normalized.includes('CLOSED') ||
		normalized.includes('CANCELLED')
	);
}

export type DisputeTimelineIconKind =
	'check' | 'shield' | 'search' | 'file' | 'bell' | 'calendar' | 'alert' | 'clock';

/** Pick a timeline icon that matches the dispute event topic. */
export function disputeTimelineIconKind(status: string): DisputeTimelineIconKind {
	const normalized = normalizeDisputeStatusKey(status);

	if (normalized.includes('WON') || normalized.includes('ACCEPTED')) return 'shield';
	if (normalized.includes('LOST') || normalized.includes('REJECTED')) return 'alert';
	if (normalized.includes('RESOLVED') || normalized.includes('CLOSED')) return 'check';
	if (
		normalized.includes('UNDER_REVIEW') ||
		normalized.includes('REVIEW') ||
		normalized.includes('ARBITRATION')
	) {
		return 'search';
	}
	if (
		normalized.includes('DOCUMENT') ||
		normalized.includes('EVIDENCE') ||
		normalized.includes('PROOF') ||
		normalized.includes('SUBMITTED') ||
		normalized.includes('REPRESENTMENT')
	) {
		return 'file';
	}
	if (normalized.includes('NOTIF') || normalized.includes('SENT')) return 'bell';
	if (normalized.includes('DUE') || normalized.includes('DEADLINE')) return 'calendar';
	if (normalized.includes('RAISED') || normalized.includes('OPEN')) return 'check';
	return 'clock';
}

export function paymentDisputeActionLabel(status: string): string {
	const normalized = normalizeDisputeStatusKey(status);
	if (normalized.includes('WON')) return 'Dispute won';
	if (normalized.includes('LOST')) return 'Dispute lost';
	return 'Dispute raised';
}

const CHARGEBACK_ALLOWED_STATUSES = new Set([
	'RESOLVED_LOST',
	'ARBITRATION_LOST',
	'MERCHANT_ACCEPTED_DISPUTE'
]);

/** Final statuses where Change Status must stay disabled. */
const STATUS_CHANGE_LOCKED_STATUSES = new Set([
	'ARBITRATION_LOST',
	'MERCHANT_ACCEPTED_DISPUTE',
	'RESOLVED_WON',
	'CLOSED_OTHER'
]);

export function canRaiseChargeback(status: string): boolean {
	return CHARGEBACK_ALLOWED_STATUSES.has(normalizeDisputeStatusKey(status));
}

export function canChangeDisputeStatus(status: string): boolean {
	return !STATUS_CHANGE_LOCKED_STATUSES.has(normalizeDisputeStatusKey(status));
}

/** Returns a hover reason when Change Status should be disabled; null when enabled. */
export function getChangeDisputeStatusDisabledReason(status: string): string | null {
	if (!canChangeDisputeStatus(status)) {
		return 'Status cannot be changed after Arbitration Lost, Merchant Accepted Dispute, Resolved Won, or Closed Other.';
	}
	return null;
}

/** Returns a hover reason when Raise chargeback should be disabled; null when enabled. */
export function getRaiseChargebackDisabledReason(
	status: string,
	hasChargeback: boolean
): string | null {
	if (hasChargeback) {
		return 'A chargeback has already been raised for this dispute.';
	}
	if (!canRaiseChargeback(status)) {
		return 'Chargebacks can only be raised for Resolved Lost, Arbitration Lost, or Merchant Accepted disputes.';
	}
	return null;
}
