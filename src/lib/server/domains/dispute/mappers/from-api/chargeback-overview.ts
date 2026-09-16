import type { ChargebackOverviewItem, DisputePagination } from '../../schema';
import { emptyDisputePagination } from './list';
import { formatDisputeAmount } from './amount';

export interface ChargebackOverviewRow extends Record<string, unknown> {
	orgId: string;
	overallAmount: string;
	principalAmount: string;
	chargebackRatio: string;
}

function asText(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return '';
	return String(value).trim();
}

export function formatChargebackRatio(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return '—';
	if (trimmed.includes('%')) return trimmed;
	const amount = Number(trimmed);
	if (!Number.isFinite(amount)) return trimmed;
	return `${amount.toFixed(2)}%`;
}

export function mapChargebackOverviewItem(item: ChargebackOverviewItem): ChargebackOverviewRow {
	return {
		orgId: asText(item.orgId) || '—',
		overallAmount: formatDisputeAmount(asText(item.overallAmount), 'INR'),
		principalAmount: formatDisputeAmount(asText(item.principalAmount), 'INR'),
		chargebackRatio: formatChargebackRatio(asText(item.chargebackRatio))
	};
}

export function mapChargebackOverviewResponse(
	items: ChargebackOverviewItem[]
): ChargebackOverviewRow[] {
	return items.map(mapChargebackOverviewItem);
}

export { emptyDisputePagination };
export type { DisputePagination };
