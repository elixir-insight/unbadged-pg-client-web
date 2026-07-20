import { getLocalTimeZone } from '@internationalized/date';
import type { ReportGenerationRequest } from './types';

function formatDateForFilename(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}${month}${day}`;
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

function buildReportContent(request: ReportGenerationRequest): string {
	const tz = getLocalTimeZone();
	const start = request.dateRange.start?.toDate(tz).toISOString().slice(0, 10) ?? '';
	const end = request.dateRange.end?.toDate(tz).toISOString().slice(0, 10) ?? '';

	const rows = [
		['Report Type', request.reportType],
		['Portal', request.portal],
		['Start Date', start],
		['End Date', end],
		['Format', request.fileFormat.toUpperCase()],
		['Service', request.filters.service ?? ''],
		['Transaction Status', request.filters.transactionStatus ?? ''],
		['Organization', request.filters.organizationId ?? ''],
		['Merchant', request.filters.merchantId ?? ''],
		['Payment Method', request.filters.paymentMethod ?? ''],
		['Settlement Status', request.filters.settlementStatus ?? '']
	];

	return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
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
 * Simulates network latency and returns a downloadable blob.
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
