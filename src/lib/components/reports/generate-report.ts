import { getLocalTimeZone } from '@internationalized/date';
import type { ReportGenerationRequest } from './types';
import { formatDate } from '$lib/utils/format-time';

function formatDateForFilename(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}${month}${day}`;
}

function escapeCsv(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

function toCsv(rows: string[][]): string {
	return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
}

function buildReportFilename(request: ReportGenerationRequest): string {
	const tz = getLocalTimeZone();
	const start = request.dateRange.start?.toDate(tz);
	const end = request.dateRange.end?.toDate(tz);
	const range =
		start && end ? `_${formatDateForFilename(start)}-${formatDateForFilename(end)}` : '';
	const extension = request.fileFormat === 'csv' ? 'csv' : 'xlsx';
	return `${request.reportType}${range}.${extension}`;
}

interface DummyTransactionRow {
	transactionId: string;
	date: string;
	merchant: string;
	service: string;
	paymentMethod: string;
	amount: string;
	status: string;
	utr: string;
}

const DUMMY_TRANSACTIONS: DummyTransactionRow[] = [
	{
		transactionId: 'TXN-100241',
		date: '2026-07-21',
		merchant: 'Northwind Capital',
		service: 'payin',
		paymentMethod: 'UPI',
		amount: '12500.00',
		status: 'success',
		utr: 'UTR982341001'
	},
	{
		transactionId: 'TXN-100242',
		date: '2026-07-21',
		merchant: 'Vertex Robotics',
		service: 'payin',
		paymentMethod: 'Credit Card',
		amount: '8200.50',
		status: 'pending',
		utr: 'UTR982341002'
	},
	{
		transactionId: 'TXN-100243',
		date: '2026-07-20',
		merchant: 'Stellar Foods',
		service: 'payout',
		paymentMethod: 'Net Banking',
		amount: '45000.00',
		status: 'failed',
		utr: 'UTR982341003'
	},
	{
		transactionId: 'TXN-100244',
		date: '2026-07-20',
		merchant: 'Northwind Capital',
		service: 'payin',
		paymentMethod: 'UPI',
		amount: '3400.00',
		status: 'refunded',
		utr: 'UTR982341004'
	},
	{
		transactionId: 'TXN-100245',
		date: '2026-07-19',
		merchant: 'Priority.Co',
		service: 'payin',
		paymentMethod: 'Debit Card',
		amount: '15750.25',
		status: 'success',
		utr: 'UTR982341005'
	},
	{
		transactionId: 'TXN-100246',
		date: '2026-07-19',
		merchant: 'Baig Corp',
		service: 'payout',
		paymentMethod: 'Wallet',
		amount: '9800.00',
		status: 'pending',
		utr: 'UTR982341006'
	},
	{
		transactionId: 'TXN-100247',
		date: '2026-07-18',
		merchant: 'SPIC',
		service: 'payin',
		paymentMethod: 'UPI',
		amount: '2200.00',
		status: 'failed',
		utr: 'UTR982341007'
	},
	{
		transactionId: 'TXN-100248',
		date: '2026-07-18',
		merchant: 'Salon',
		service: 'payin',
		paymentMethod: 'Credit Card',
		amount: '6750.00',
		status: 'success',
		utr: 'UTR982341008'
	}
];

function filterDummyTransactions(request: ReportGenerationRequest): DummyTransactionRow[] {
	const selectedStatuses = request.filters.transactionStatus ?? [];
	const selectedService = request.filters.service;
	const selectedPaymentMethod = request.filters.paymentMethod;

	return DUMMY_TRANSACTIONS.filter((row) => {
		if (selectedStatuses.length > 0 && !selectedStatuses.includes(row.status)) return false;
		if (selectedService && selectedService !== 'both' && row.service !== selectedService)
			return false;
		if (selectedPaymentMethod && row.paymentMethod !== selectedPaymentMethod) return false;
		return true;
	});
}

function buildSummaryRows(request: ReportGenerationRequest): string[][] {
	const tz = getLocalTimeZone();
	const start = request.dateRange.start?.toDate(tz);
	const end = request.dateRange.end?.toDate(tz);

	return [
		['Report Type', request.reportType],
		['Portal', request.portal],
		['Start Date', start ? formatDate(start) : ''],
		['End Date', end ? formatDate(end) : ''],
		['Format', request.fileFormat.toUpperCase()],
		['Service', request.filters.service ?? 'All'],
		['Transaction Status', (request.filters.transactionStatus ?? []).join('|') || 'All'],
		['Organization', request.filters.organizationId ?? 'All'],
		['Merchant', request.filters.merchantId ?? 'All'],
		['Payment Method', request.filters.paymentMethod ?? 'All'],
		['Settlement Status', request.filters.settlementStatus ?? 'All']
	];
}

function buildDummyDataRows(request: ReportGenerationRequest): string[][] {
	const headers = [
		'Transaction ID',
		'Date',
		'Merchant',
		'Service',
		'Payment Method',
		'Amount',
		'Status',
		'UTR'
	];

	const rows = filterDummyTransactions(request).map((row) => [
		row.transactionId,
		formatDate(row.date),
		row.merchant,
		row.service,
		row.paymentMethod,
		row.amount,
		row.status,
		row.utr
	]);

	return [headers, ...rows];
}

function buildReportContent(request: ReportGenerationRequest): string {
	const summary = buildSummaryRows(request);
	const data = buildDummyDataRows(request);

	return `${toCsv(summary)}\n\n${toCsv(data)}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

/**
 * Mock report generation until the backend API is available.
 * Simulates network latency and returns a downloadable blob with dummy rows.
 */
export async function generateReport(request: ReportGenerationRequest): Promise<Blob> {
	await new Promise((resolve) => setTimeout(resolve, 1800));

	const content = buildReportContent(request);
	const mimeType =
		request.fileFormat === 'csv'
			? 'text/csv;charset=utf-8'
			: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

	return new Blob([content], { type: mimeType });
}

export async function generateAndDownloadReport(request: ReportGenerationRequest): Promise<void> {
	const blob = await generateReport(request);
	downloadBlob(blob, buildReportFilename(request));
}
