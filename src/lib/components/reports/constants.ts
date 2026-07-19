import type { DropdownOption } from '$lib/components/reusable';
import type { ReportFilterKey, ReportPortal, ReportType } from './types';

export const MAX_DATE_RANGE_DAYS = 365;

export const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
	{ value: 'transactions', label: 'Transactions' },
	{ value: 'settlements', label: 'Settlements' },
	{ value: 'refunds', label: 'Refunds' },
	{ value: 'chargebacks', label: 'Chargebacks' },
	{ value: 'reconciliation', label: 'Reconciliation' },
	{ value: 'merchant-summary', label: 'Merchant Summary' },
	{ value: 'organization-summary', label: 'Organization Summary' }
];

export const MERCHANT_REPORT_TYPES: ReportType[] = [
	'transactions',
	'settlements',
	'refunds',
	'chargebacks',
	'reconciliation',
	'merchant-summary'
];

export const SERVICE_OPTIONS: DropdownOption[] = [
	{ value: 'payin', label: 'Payin' },
	{ value: 'payout', label: 'Payout' },
	{ value: 'both', label: 'Both' }
];

export const TRANSACTION_STATUS_OPTIONS: DropdownOption[] = [
	{ value: 'success', label: 'Success' },
	{ value: 'pending', label: 'Pending' },
	{ value: 'failed', label: 'Failed' },
	{ value: 'refunded', label: 'Refunded' }
];

export const PAYMENT_METHOD_OPTIONS: DropdownOption[] = [
	{ value: 'UPI', label: 'UPI' },
	{ value: 'Net Banking', label: 'Net Banking' },
	{ value: 'Credit Card', label: 'Credit Card' },
	{ value: 'Debit Card', label: 'Debit Card' },
	{ value: 'Wallet', label: 'Wallet' }
];

export const SETTLEMENT_STATUS_OPTIONS: DropdownOption[] = [
	{ value: 'pending', label: 'Pending' },
	{ value: 'processing', label: 'Processing' },
	{ value: 'settled', label: 'Settled' },
	{ value: 'failed', label: 'Failed' }
];

const MERCHANT_FILTER_KEYS: ReportFilterKey[] = ['service', 'transactionStatus'];

const MANAGEMENT_FILTER_KEYS: ReportFilterKey[] = [
	'organization',
	'merchant',
	'service',
	'transactionStatus',
	'paymentMethod',
	'settlementStatus'
];

export const REPORT_FILTER_CONFIG: Record<ReportType, ReportFilterKey[]> = {
	transactions: ['service', 'transactionStatus', 'organization', 'merchant', 'paymentMethod'],
	settlements: ['service', 'organization', 'merchant', 'settlementStatus'],
	refunds: ['service', 'transactionStatus', 'organization', 'merchant'],
	chargebacks: ['transactionStatus', 'organization', 'merchant'],
	reconciliation: ['service', 'organization', 'merchant'],
	'merchant-summary': ['service', 'organization', 'merchant'],
	'organization-summary': ['organization']
};

export function getReportTypeOptions(portal: ReportPortal): DropdownOption[] {
	const allowedTypes =
		portal === 'merchant' ? MERCHANT_REPORT_TYPES : REPORT_TYPE_OPTIONS.map((o) => o.value);
	return REPORT_TYPE_OPTIONS.filter((option) => allowedTypes.includes(option.value));
}

export function getVisibleFilters(
	portal: ReportPortal,
	reportType: ReportType | undefined
): ReportFilterKey[] {
	if (!reportType) return [];

	const portalKeys = portal === 'merchant' ? MERCHANT_FILTER_KEYS : MANAGEMENT_FILTER_KEYS;
	return REPORT_FILTER_CONFIG[reportType].filter((key) => portalKeys.includes(key));
}
