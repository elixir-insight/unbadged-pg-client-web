import type { DateRange } from 'bits-ui';

export type ReportPortal = 'merchant' | 'management';

export type ReportType =
	| 'transactions'
	| 'settlements'
	| 'refunds'
	| 'chargebacks'
	| 'reconciliation'
	| 'merchant-summary'
	| 'organization-summary';

export type ReportFileFormat = 'csv' | 'xlsx';

export type ReportFilterKey =
	| 'service'
	| 'transactionStatus'
	| 'organization'
	| 'merchant'
	| 'paymentMethod'
	| 'settlementStatus';

export interface ReportFilters {
	service?: string;
	transactionStatus?: string;
	organizationId?: string;
	merchantId?: string;
	paymentMethod?: string;
	settlementStatus?: string;
}

export interface ReportGenerationRequest {
	portal: ReportPortal;
	reportType: ReportType;
	dateRange: DateRange;
	fileFormat: ReportFileFormat;
	filters: ReportFilters;
}

export interface ReportValidationResult {
	valid: boolean;
	error?: string;
}
