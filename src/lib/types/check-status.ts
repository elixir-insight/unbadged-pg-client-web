export type SearchByType = 'utr' | 'crn' | 'client_order_id';

export type SingleStatus = 'Success' | 'Pending' | 'Failed';

export interface SingleResult {
	transactionId: string;
	status: SingleStatus;
	amount: number;
	date: string;
	merchantName: string;
	failureReason?: string;
}

export interface BulkValidation {
	uploadId: string;
	filename: string;
	searchBy: SearchByType;
	totalRows: number;
	valid: number;
	invalid: number;
	duplicates: number;
	errorReportUrl?: string;
}

export interface BulkResult {
	total: number;
	success: number;
	failed: number;
	pending: number;
	resultsCsvUrl: string;
}

export const SEARCH_BY_OPTIONS = [
	{ value: 'utr', label: 'UTR Number' },
	{ value: 'crn', label: 'CRN Number' },
	{ value: 'client_order_id', label: 'Client Order ID' }
] as const;

export const SEARCH_BY_PLACEHOLDERS: Record<SearchByType, string> = {
	utr: 'Enter UTR Number',
	crn: 'Enter CRN Number',
	client_order_id: 'Enter Client Order ID'
};

export function searchByLabel(searchBy: SearchByType): string {
	return SEARCH_BY_OPTIONS.find((o) => o.value === searchBy)?.label ?? searchBy;
}

export function formatInr(amount: number): string {
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 2
	}).format(amount);
}

export function formatDateTime(iso: string): string {
	return new Intl.DateTimeFormat('en-IN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(iso));
}
