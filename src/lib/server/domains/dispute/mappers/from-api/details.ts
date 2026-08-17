import { formatDate } from '$lib/utils/format-time';
import { formatDisputeStatusLabel } from '$lib/utils/dispute-status';
import { formatSnakeCaseLabel } from '$lib/utils/format-display';
import type { DisputeListItem } from '../../schema';

const amountFormatter = new Intl.NumberFormat('en-IN', {
	style: 'currency',
	currency: 'INR',
	maximumFractionDigits: 2
});

export interface DisputeDetailView {
	disputeId: string;
	orderId: string;
	transactionId: string;
	orgId: string;
	organization: string;
	amount: string;
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

function formatAmount(value: string): string {
	const normalized = value.replace(/,/g, '').trim();
	if (!normalized) return '—';
	const amount = Number(normalized);
	return Number.isFinite(amount) ? amountFormatter.format(amount) : value;
}

function formatDisplayDate(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return '—';
	const formatted = formatDate(trimmed);
	return formatted || '—';
}

export function mapDisputeDetail(
	item: DisputeListItem,
	organizationName?: string
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
		amount: formatAmount(asText(item.amount)),
		currency: asText(item.currency) || 'INR',
		source,
		sourceLabel: source ? formatSnakeCaseLabel(source) : '—',
		status,
		statusLabel: formatDisputeStatusLabel(status),
		bankRefNumber: displayValue(asText(item.bankRefNumber)),
		raisedOn: formatDisplayDate(asText(item.createdAt)),
		evidenceDueBy: formatDisplayDate(evidenceDueByRaw),
		evidenceDueByRaw,
		reasonCode: displayValue(asText(item.reasonCode)),
		resolvedBy: displayValue(asText(item.resolvedBy)),
		assignedTo: displayValue(asText(item.assignedTo)),
		raisedBy: displayValue(asText(item.raisedBy)),
		pipelineCode: displayValue(asText(item.pipelineCode)),
		gatewayDescription: displayValue(asText(item.gatewayDescription)),
		pipelineDescription: displayValue(asText(item.pipelineDescription)),
		resolutionNotes: displayValue(asText(item.resolutionNotes))
	};
}
