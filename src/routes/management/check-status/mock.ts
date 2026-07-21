import type { BulkResult, BulkValidation, SingleResult } from '$lib/types/check-status';
import {
	SINGLE_TRANSACTION_DEMO_KEYS,
	SINGLE_TRANSACTION_FIXTURES
} from '$lib/fixtures/check-status';

export { SINGLE_TRANSACTION_DEMO_KEYS, SINGLE_TRANSACTION_FIXTURES };

export type SingleFixtureKey = keyof typeof SINGLE_TRANSACTION_FIXTURES;

export function mockSingleResult(key: SingleFixtureKey = 'success'): SingleResult {
	return { ...SINGLE_TRANSACTION_FIXTURES[key] };
}

export function mockBulkValidation(overrides: Partial<BulkValidation> = {}): BulkValidation {
	return {
		uploadId: 'upload-test-001',
		filename: 'sample-bulk-transactions.csv',
		searchBy: 'utr',
		totalRows: 3,
		valid: 3,
		invalid: 0,
		duplicates: 0,
		...overrides
	};
}

export function mockBulkResult(overrides: Partial<BulkResult> = {}): BulkResult {
	return {
		total: 3,
		success: 2,
		failed: 1,
		pending: 0,
		resultsCsvUrl: '/api/transactions/bulk/results/upload-test-001',
		...overrides
	};
}

export function mockCsvFile(
	content = 'identifier\nTXN-2024-AB12CD\nTXN-2024-EF34GH',
	name = 'sample-bulk-transactions.csv'
): File {
	return new File([content], name, { type: 'text/csv' });
}
