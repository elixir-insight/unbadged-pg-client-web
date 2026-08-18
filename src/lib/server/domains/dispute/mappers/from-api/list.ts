import { formatDate } from '$lib/utils/format-time';
import { disputeStatusLabel, type DisputeStatusOption } from '$lib/utils/dispute-status';
import type { DisputeListItem, DisputePagination } from '../../schema';
import { formatDisputeAmount } from './amount';

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

function formatListDate(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return '—';
	const formatted = formatDate(trimmed);
	return formatted || '—';
}

export function mapDisputeListItem(
	item: DisputeListItem,
	statuses: DisputeStatusOption[] = []
): DisputeListRow {
	const status = asText(item.status);

	return {
		disputeId: item.disputeId,
		orderId: asText(item.orderId) || '—',
		transactionId: asText(item.pipelineTransactionId) || '—',
		amount: formatDisputeAmount(asText(item.amount), asText(item.currency)),
		status,
		statusLabel: disputeStatusLabel(status, statuses),
		raisedOn: formatListDate(asText(item.createdAt)),
		evidenceDueBy: formatListDate(asText(item.evidenceDueBy)),
		source: asText(item.source)
	};
}

export function mapDisputeListResponse(
	items: DisputeListItem[],
	statuses: DisputeStatusOption[] = []
): DisputeListRow[] {
	return items.map((item) => mapDisputeListItem(item, statuses));
}

export function emptyDisputePagination(limit: number, page: number): DisputePagination {
	return { limit, page, total: 0 };
}
