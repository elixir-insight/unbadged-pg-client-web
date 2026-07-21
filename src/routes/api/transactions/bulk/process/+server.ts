import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBulkUpload, processBulkUpload } from '$lib/server/check-status-store';

export const POST: RequestHandler = async ({ request }) => {
	let body: { uploadId?: string };

	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid request body');
	}

	const uploadId = body.uploadId?.trim();
	if (!uploadId) {
		throw error(400, 'uploadId is required');
	}

	const record = getBulkUpload(uploadId);
	if (!record) {
		throw error(404, 'Upload session not found');
	}

	if (record.validation.valid === 0) {
		throw error(400, 'No valid rows to process');
	}

	await new Promise((resolve) => setTimeout(resolve, 1200));

	const result = processBulkUpload(uploadId);
	if (!result) {
		throw error(500, 'Failed to process batch');
	}

	return json(result);
};
