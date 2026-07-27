import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildErrorReportCsv } from '$lib/server/check-status-store';

export const GET: RequestHandler = async ({ params }) => {
	const csv = buildErrorReportCsv(params.uploadId);
	if (!csv) {
		throw error(404, 'Error report not found');
	}

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="error-report-${params.uploadId}.csv"`
		}
	});
};
