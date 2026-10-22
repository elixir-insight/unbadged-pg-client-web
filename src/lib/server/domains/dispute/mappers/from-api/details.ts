import { formatDate } from '$lib/utils/format-time';
import { disputeStatusLabel, type DisputeStatusOption } from '$lib/utils/dispute-status';
import { formatSnakeCaseLabel } from '$lib/utils/format-display';
import type { DisputeListItem } from '../../schema';
import { formatDisputeAmount } from './amount';

export interface DisputeDetailView {
	disputeId: string;
	orderId: string;
	transactionId: string;
	orgId: string;
	organization: string;
	amount: string;
	amountRaw: string;
	currency: string;
	source: string;
	sourceLabel: string;
	status: string;
	statusLabel: string;
	bankRefNumber: string;
	raisedOn: string;
	evidenceDueBy: string;
	evidenceDueByRaw: string;
	reasonCode: string;
	resolvedBy: string;
	assignedTo: string;
	raisedBy: string;
	pipelineCode: string;
	gatewayDescription: string;
	pipelineDescription: string;
	resolutionNotes: string;
}

function asText(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return '';
	return String(value).trim();
}

function displayValue(value: string): string {
	return value || '—';
}

function formatDisplayDate(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return '—';
	const formatted = formatDate(trimmed);
	return formatted || '—';
}

export function mapDisputeDetail(
	item: DisputeListItem,
	organizationName?: string,
	statuses: DisputeStatusOption[] = []
): DisputeDetailView {
	const status = asText(item.status);
	const source = asText(item.source);
	const orgId = asText(item.orgId);
	const evidenceDueByRaw = asText(item.evidenceDueBy);

	return {
		disputeId: item.disputeId,
		orderId: displayValue(asText(item.orderId)),
		transactionId: displayValue(asText(item.pipelineTransactionId)),
		orgId,
		organization: displayValue(organizationName?.trim() || orgId),
		amount: formatDisputeAmount(asText(item.amount), asText(item.currency)),
		amountRaw: asText(item.amount),
		currency: asText(item.currency),
		source,
		sourceLabel: source ? formatSnakeCaseLabel(source) : '—',
		status,
		statusLabel: disputeStatusLabel(status, statuses),
		bankRefNumber: asText(item.bankRefNumber),
		raisedOn: formatDisplayDate(asText(item.createdAt)),
		evidenceDueBy: formatDisplayDate(evidenceDueByRaw),
		evidenceDueByRaw,
		reasonCode: asText(item.reasonCode),
		resolvedBy: asText(item.resolvedBy),
		assignedTo: displayValue(asText(item.assignedTo)),
		raisedBy: displayValue(asText(item.raisedBy)),
		pipelineCode: displayValue(asText(item.pipelineCode)),
		gatewayDescription: asText(item.gatewayDescription),
		pipelineDescription: asText(item.pipelineDescription),
		resolutionNotes: asText(item.resolutionNotes)
	};
}
