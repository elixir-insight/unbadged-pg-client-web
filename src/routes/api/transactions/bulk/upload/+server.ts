import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createBulkUpload } from '$lib/server/check-status-store';
import type { SearchByType } from '$lib/types/check-status';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';

const MAX_ROWS = 1000;
const VALID_SEARCH_BY = new Set<SearchByType>(['utr', 'crn', 'client_order_id']);

export const POST: RequestHandler = async ({ request, locals }) => {
	requirePermission(locals.userPermissions, 'PAYINS', 'read');
	const formData = await request.formData();
	const file = formData.get('file');
	const searchBy = formData.get('searchBy') as SearchByType;

	if (!VALID_SEARCH_BY.has(searchBy)) {
		throw error(400, 'Invalid identifier type');
	}

	if (!(file instanceof File)) {
		throw error(400, 'CSV file is required');
	}

	if (!file.name.toLowerCase().endsWith('.csv')) {
		throw error(400, 'Only .csv files are accepted');
	}

	const text = await file.text();
	const rows = text
		.split(/\r?\n/)
		.map((line) => line.split(',')[0]?.trim() ?? line.trim())
		.filter((line, index) => {
			if (index === 0 && /^identifier|utr|crn|client/i.test(line)) return false;
			return Boolean(line);
		});

	if (rows.length === 0) {
		throw error(400, 'CSV file is empty');
	}

	if (rows.length > MAX_ROWS) {
		throw error(400, 'CSV exceeds the maximum of 1,000 rows');
	}

	await new Promise((resolve) => setTimeout(resolve, 800));

	const record = createBulkUpload(file.name, searchBy, rows);
	const { uploadId, filename, totalRows, valid, invalid, duplicates, errorReportUrl } =
		record.validation;

	return json({
		uploadId,
		filename,
		searchBy,
		totalRows,
		valid,
		invalid,
		duplicates,
		errorReportUrl
	});
};
