import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildErrorReportCsv } from '$lib/server/check-status-store';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';

export const GET: RequestHandler = async ({ params, locals }) => {
	requirePermission(locals.userPermissions, 'PAYINS', 'read');
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
