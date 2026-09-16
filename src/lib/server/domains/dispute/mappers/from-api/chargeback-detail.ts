import type { DisputeChargebackItem, DisputePagination } from '../../schema';
import { formatAbsoluteTime } from '$lib/utils/format-time';
import { emptyDisputePagination } from './list';
import { formatDisputeAmount } from './amount';

export interface ChargebackDetailRow extends Record<string, unknown> {
	id: string;
	disputeId: string;
	additionalFees: string;
	bankReference: string;
	chargebackAmount: string;
	principalAmount: string;
	currency: string;
	notes: string;
	recordedBy: string;
	createdAt: string;
	updatedAt: string;
}

function asText(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return '';
	return String(value).trim();
}

function formatAmount(value: string, currency: string): string {
	return formatDisputeAmount(value, currency || 'INR');
}

function formatTimestamp(value: string): string {
	if (!value) return '—';
	return formatAbsoluteTime(value);
}

export function mapChargebackDetailItem(item: DisputeChargebackItem): ChargebackDetailRow {
	const currency = asText(item.currency) || 'INR';

	return {
		id: asText(item.id) || '—',
		disputeId: asText(item.disputeId) || '—',
		additionalFees: formatAmount(asText(item.additionalFees), currency),
		bankReference: asText(item.bankReference) || '—',
		chargebackAmount: formatAmount(asText(item.chargebackAmount), currency),
		principalAmount: formatAmount(asText(item.principalAmount), currency),
		currency,
		notes: asText(item.notes),
		recordedBy: asText(item.recordedBy) || '—',
		createdAt: formatTimestamp(asText(item.createdAt)),
		updatedAt: formatTimestamp(asText(item.updatedAt))
	};
}

export function mapChargebackDetailResponse(items: DisputeChargebackItem[]): ChargebackDetailRow[] {
	return items.map(mapChargebackDetailItem);
}

export { emptyDisputePagination };
export type { DisputePagination };
