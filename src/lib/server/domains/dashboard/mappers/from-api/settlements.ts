import type { DashboardSettlement } from '$lib/components/merchant-dashboard/dashboard-data';
import type { SettlementListItem } from '../../../settlement/schema';
import { parseSettlementAmount } from '../../../settlement/mappers/from-api/list';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
	day: '2-digit',
	month: 'short',
	year: 'numeric',
	timeZone: 'Asia/Kolkata'
});

function formatSettlementDate(value: string | null | undefined): string {
	const trimmed = value?.trim() ?? '';
	if (!trimmed) return '—';
	const date = new Date(trimmed);
	if (Number.isNaN(date.getTime())) return trimmed;
	return dateFormatter.format(date);
}

function mapSettlementStatus(status: string): DashboardSettlement['status'] {
	const normalized = status.trim().toUpperCase();
	if (normalized === 'SETTLED') return 'settled';
	if (normalized === 'FAILED') return 'failed';
	return 'pending';
}

export function mapDashboardSettlement(item: SettlementListItem): DashboardSettlement {
	return {
		id: item.settlementId,
		date: formatSettlementDate(item.settlementDatetime || item.createdAt),
		grossAmount: parseSettlementAmount(item.grossAmount) ?? 0,
		netAmount: parseSettlementAmount(item.netSettledAmount) ?? 0,
		refunds: parseSettlementAmount(item.refundAmount) ?? 0,
		status: mapSettlementStatus(item.status),
		utr: item.bankReference?.trim() || null
	};
}

export function mapDashboardSettlements(items: SettlementListItem[]): DashboardSettlement[] {
	return items.map(mapDashboardSettlement);
}
