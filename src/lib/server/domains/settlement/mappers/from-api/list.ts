import type { SettlementListItem } from '../../schema';
import type { Settlement, SettlementStatus } from '$lib/types/settlement';
import { formatSettlementAmount } from './overview';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
	day: '2-digit',
	month: 'short',
	year: 'numeric'
});

export function parseSettlementAmount(value: string | null | undefined): number | null {
	if (value == null) return null;
	const normalized = value.replace(/,/g, '').trim();
	if (!normalized) return null;
	const amount = Number(normalized);
	return Number.isFinite(amount) ? amount : null;
}

export function deriveFeesAmount(
	grossAmount: string,
	netSettledAmount: string,
	refundAmount: string | null | undefined,
	chargebackAmount: string | null | undefined
): string {
	const gross = parseSettlementAmount(grossAmount);
	const net = parseSettlementAmount(netSettledAmount);
	const refund = parseSettlementAmount(refundAmount) ?? 0;
	const chargeback = parseSettlementAmount(chargebackAmount) ?? 0;

	if (gross === null || net === null) return '—';

	const fees = Math.max(0, gross - net - refund - chargeback);
	return formatSettlementAmount(String(fees));
}

export function mapSettlementApiStatus(status: string): SettlementStatus {
	const normalized = status.trim().toUpperCase();
	if (normalized === 'SETTLED') return 'settled';
	if (normalized === 'FAILED') return 'failed';
	return 'processing';
}

export function mapUiStatusToApi(
	status: string | undefined
): 'PENDING' | 'SETTLED' | 'FAILED' | undefined {
	if (!status) return undefined;
	const normalized = status.trim().toLowerCase();
	if (normalized === 'settled' || normalized === 'completed') return 'SETTLED';
	if (normalized === 'failed') return 'FAILED';
	if (normalized === 'processing' || normalized === 'pending') return 'PENDING';
	return undefined;
}

/** Management UI statuses (completed/pending/failed). */
export function mapSettlementApiStatusToManagement(
	status: string
): 'completed' | 'pending' | 'failed' {
	const normalized = status.trim().toUpperCase();
	if (normalized === 'SETTLED') return 'completed';
	if (normalized === 'FAILED') return 'failed';
	return 'pending';
}

export interface ManagementSettlementListRow {
	merchantId: string;
	merchantName: string;
	settlementId: string;
	settlementDate: string;
	saleAmount: number;
	deductions: number;
	netPayout: number;
	status: 'completed' | 'pending' | 'failed';
	bankReference: string | null;
}

export function mapManagementSettlementListItem(
	item: SettlementListItem
): ManagementSettlementListRow {
	const gross = parseSettlementAmount(item.grossAmount) ?? 0;
	const net = parseSettlementAmount(item.netSettledAmount) ?? 0;
	const refund = parseSettlementAmount(item.refundAmount) ?? 0;
	const chargeback = parseSettlementAmount(item.chargebackAmount) ?? 0;
	const fees = Math.max(0, gross - net - refund - chargeback);
	const deductions = Math.round((fees + refund + chargeback) * 100) / 100;
	const datetime = item.settlementDatetime?.trim() || item.createdAt?.trim() || '';

	return {
		merchantId: item.orgId?.trim() || '',
		merchantName: item.legalCompanyName?.trim() || '—',
		settlementId: item.settlementId,
		settlementDate: datetime ? datetime.slice(0, 10) : '',
		saleAmount: gross,
		deductions,
		netPayout: net,
		status: mapSettlementApiStatusToManagement(item.status),
		bankReference: item.bankReference?.trim() || null
	};
}

export function mapManagementSettlementListResponse(
	items: SettlementListItem[]
): ManagementSettlementListRow[] {
	return items.map(mapManagementSettlementListItem);
}

/** Map list item into management SettlementDetail header (transactions loaded separately). */
export function mapManagementSettlementListItemToDetail(item: SettlementListItem) {
	const row = mapManagementSettlementListItem(item);
	return {
		settlementId: row.settlementId,
		merchantId: row.merchantId,
		merchantName: row.merchantName,
		settlementDatetime: item.settlementDatetime?.trim() || item.createdAt?.trim() || '',
		bankReference: row.bankReference ?? '—',
		saleAmount: row.saleAmount,
		deductions: row.deductions,
		netPayout: row.netPayout,
		status: row.status,
		orderStats: {
			orders: 0,
			successful: 0,
			pending: 0,
			created: 0,
			failed: 0
		},
		transactions: [] as {
			transactionId: string;
			orderId: string;
			type: 'sale' | 'refund' | 'chargeback';
			grossAmount: number;
			tdrAmount: number;
			netAmount: number;
			paymentMode: string;
		}[]
	};
}

function formatSettlementDate(value: string | null | undefined): string {
	const trimmed = value?.trim() ?? '';
	if (!trimmed) return '—';
	const date = new Date(trimmed);
	if (Number.isNaN(date.getTime())) return trimmed;
	return dateFormatter.format(date);
}

export interface SettlementListRow {
	id: string;
	utr: string | null;
	amount: string;
	fees: string;
	netAmount: string;
	settledOn: string;
	status: SettlementStatus;
}

export function mapSettlementListItem(item: SettlementListItem): SettlementListRow {
	const utr = item.bankReference?.trim() || null;

	return {
		id: item.settlementId,
		utr,
		amount: formatSettlementAmount(item.grossAmount),
		fees: deriveFeesAmount(
			item.grossAmount,
			item.netSettledAmount,
			item.refundAmount,
			item.chargebackAmount
		),
		netAmount: formatSettlementAmount(item.netSettledAmount),
		settledOn: formatSettlementDate(item.settlementDatetime),
		status: mapSettlementApiStatus(item.status)
	};
}

export function mapSettlementListResponse(items: SettlementListItem[]): SettlementListRow[] {
	return items.map(mapSettlementListItem);
}

function accountLast4(accountNumber: string | null | undefined): string {
	const digits = (accountNumber ?? '').replace(/\s/g, '');
	if (digits.length >= 4) return digits.slice(-4);
	return digits || '————';
}

/** Map a list API item into the detail-page Settlement shape (orders empty until detail API). */
export function mapSettlementListItemToDetail(item: SettlementListItem): Settlement {
	const gross = parseSettlementAmount(item.grossAmount) ?? 0;
	const net = parseSettlementAmount(item.netSettledAmount) ?? 0;
	const refund = parseSettlementAmount(item.refundAmount) ?? 0;
	const chargeback = parseSettlementAmount(item.chargebackAmount) ?? 0;

	return {
		id: item.settlementId,
		utr: item.bankReference?.trim() || null,
		status: mapSettlementApiStatus(item.status),
		settledOn: item.settlementDatetime?.trim() || null,
		expectedOn: null,
		settledTo: {
			bankName: item.destinationBank?.trim() || '—',
			accountLast4: accountLast4(item.accountNumber)
		},
		grossAmount: gross,
		refundsAndChargebacks: Math.round((refund + chargeback) * 100) / 100,
		fees: Math.max(0, Math.round((gross - net - refund - chargeback) * 100) / 100),
		netAmount: net,
		transactionCount: 0,
		orders: []
	};
}
