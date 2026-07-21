import type {
	BulkResult,
	BulkValidation,
	SearchByType,
	SingleResult,
	SingleStatus
} from '$lib/types/check-status';
import {
	SINGLE_TRANSACTION_DEMO_KEYS,
	SINGLE_TRANSACTION_FIXTURES
} from '$lib/fixtures/check-status';

export interface BulkUploadRecord {
	id: string;
	filename: string;
	searchBy: SearchByType;
	rows: string[];
	validation: BulkValidation;
	processed?: BulkResult;
}

const MOCK_TRANSACTIONS: Record<string, SingleResult> = {
	[SINGLE_TRANSACTION_DEMO_KEYS.success]: { ...SINGLE_TRANSACTION_FIXTURES.success },
	[SINGLE_TRANSACTION_DEMO_KEYS.pending]: { ...SINGLE_TRANSACTION_FIXTURES.pending },
	[SINGLE_TRANSACTION_DEMO_KEYS.failed]: { ...SINGLE_TRANSACTION_FIXTURES.failed }
};

const uploads = new Map<string, BulkUploadRecord>();

function normalizeKey(searchBy: SearchByType, value: string): string {
	const trimmed = value.trim();
	if (searchBy === 'client_order_id') return trimmed.toUpperCase();
	return trimmed.toUpperCase();
}

function lookupKey(searchBy: SearchByType, value: string): string | null {
	const normalized = normalizeKey(searchBy, value);
	if (searchBy === 'utr') return normalized;
	if (searchBy === 'crn') return normalized;
	return normalized;
}

export function findTransaction(searchBy: SearchByType, value: string): SingleResult | null {
	const key = lookupKey(searchBy, value);
	if (!key) return null;

	if (searchBy === 'utr') return MOCK_TRANSACTIONS[key] ?? null;
	if (searchBy === 'crn') return MOCK_TRANSACTIONS[key] ?? null;
	return MOCK_TRANSACTIONS[key] ?? null;
}

function isValidIdentifier(value: string): boolean {
	return /^[A-Za-z0-9_-]{4,32}$/.test(value.trim());
}

function resolveStatus(value: string, index: number): SingleStatus {
	const hash = value.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) + index;
	const mod = hash % 10;
	if (mod < 6) return 'Success';
	if (mod < 8) return 'Pending';
	return 'Failed';
}

export function createBulkUpload(
	filename: string,
	searchBy: SearchByType,
	rawRows: string[]
): BulkUploadRecord {
	const rows = rawRows.map((r) => r.trim()).filter(Boolean);
	const seen = new Set<string>();
	let valid = 0;
	let invalid = 0;
	let duplicates = 0;

	for (const row of rows) {
		const key = row.toLowerCase();
		if (!isValidIdentifier(row)) {
			invalid += 1;
			continue;
		}
		if (seen.has(key)) {
			duplicates += 1;
			continue;
		}
		seen.add(key);
		valid += 1;
	}

	const id = crypto.randomUUID();
	const validation: BulkValidation = {
		uploadId: id,
		filename,
		searchBy,
		totalRows: rows.length,
		valid,
		invalid,
		duplicates,
		errorReportUrl: invalid > 0 ? `/api/transactions/bulk/error-report/${id}` : undefined
	};

	const record: BulkUploadRecord = {
		id,
		filename,
		searchBy,
		rows,
		validation
	};

	uploads.set(id, record);
	return record;
}

export function getBulkUpload(uploadId: string): BulkUploadRecord | undefined {
	return uploads.get(uploadId);
}

export function processBulkUpload(uploadId: string): BulkResult | null {
	const record = uploads.get(uploadId);
	if (!record) return null;

	const seen = new Set<string>();
	const validRows: string[] = [];

	for (const row of record.rows) {
		const trimmed = row.trim();
		if (!isValidIdentifier(trimmed)) continue;
		const key = trimmed.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		validRows.push(trimmed);
	}

	let success = 0;
	let failed = 0;
	let pending = 0;

	for (let i = 0; i < validRows.length; i += 1) {
		const status = resolveStatus(validRows[i], i);
		if (status === 'Success') success += 1;
		else if (status === 'Pending') pending += 1;
		else failed += 1;
	}

	const result: BulkResult = {
		total: validRows.length,
		success,
		failed,
		pending,
		resultsCsvUrl: `/api/transactions/bulk/results/${uploadId}`
	};

	record.processed = result;
	uploads.set(uploadId, record);
	return result;
}

export function buildErrorReportCsv(uploadId: string): string | null {
	const record = uploads.get(uploadId);
	if (!record) return null;

	const seen = new Set<string>();
	const lines = ['row_number,identifier,error'];

	record.rows.forEach((row, index) => {
		const trimmed = row.trim();
		if (!trimmed) return;

		let error: string | null = null;
		if (!isValidIdentifier(trimmed)) {
			error = 'Invalid identifier format';
		} else {
			const key = trimmed.toLowerCase();
			if (seen.has(key)) {
				error = 'Duplicate identifier';
			} else {
				seen.add(key);
			}
		}

		if (error) {
			lines.push(`${index + 1},"${trimmed.replaceAll('"', '""')}",${error}`);
		}
	});

	return lines.join('\n');
}

export function buildResultsCsv(uploadId: string): string | null {
	const record = uploads.get(uploadId);
	if (!record?.processed) return null;

	const seen = new Set<string>();
	const validRows: string[] = [];

	for (const row of record.rows) {
		const trimmed = row.trim();
		if (!isValidIdentifier(trimmed)) continue;
		const key = trimmed.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		validRows.push(trimmed);
	}

	const lines = ['identifier,status,transaction_id,amount,merchant_name'];

	validRows.forEach((identifier, index) => {
		const status = resolveStatus(identifier, index);
		const found = findTransaction(record.searchBy, identifier);
		const transactionId = found?.transactionId ?? `TXN-BULK-${index + 1}`;
		const amount = found?.amount ?? 1000 + index * 100;
		const merchant = found?.merchantName ?? 'Unknown Merchant';
		lines.push(
			`${identifier},${status},${transactionId},${amount},"${merchant.replaceAll('"', '""')}"`
		);
	});

	return lines.join('\n');
}
