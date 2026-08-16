import { formatDate } from '$lib/utils/format-time';
import { formatDisputeStatusLabel } from '$lib/utils/dispute-status';
import type { DisputeListItem, DisputePagination } from '../../schema';

const amountFormatter = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 2
});

export interface DisputeListRow extends Record<string, unknown> {
	disputeId: string;
	orderId: string;
	transactionId: string;
	amount: string;
	status: string;
	statusLabel: string;
	raisedOn: string;
	evidenceDueBy: string;
	source: string;
}

function asText(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return '';
	return String(value).trim();
}

function formatAmount(value: string): string {
	const normalized = value.replace(/,/g, '').trim();
	if (!normalized) return '—';
	const amount = Number(normalized);
	return Number.isFinite(amount) ? amountFormatter.format(amount) : value;
}

function formatListDate(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return '—';
	const formatted = formatDate(trimmed);
	return formatted || '—';
}

export function mapDisputeListItem(item: DisputeListItem): DisputeListRow {
	const status = asText(item.status);

	return {
		disputeId: item.disputeId,
		orderId: asText(item.orderId) || '—',
		transactionId: asText(item.pipelineTransactionId) || '—',
		amount: formatAmount(asText(item.amount)),
		status,
		statusLabel: formatDisputeStatusLabel(status),
		raisedOn: formatListDate(asText(item.createdAt)),
		evidenceDueBy: formatListDate(asText(item.evidenceDueBy)),
		source: asText(item.source)
	};
}

export function mapDisputeListResponse(items: DisputeListItem[]): DisputeListRow[] {
	return items.map(mapDisputeListItem);
}

export function emptyDisputePagination(limit: number, page: number): DisputePagination {
	return { limit, page, total: 0 };
}
