import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildResultsCsv } from '$lib/server/check-status-store';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';

export const GET: RequestHandler = async ({ params, locals }) => {
	requirePermission(locals.userPermissions, 'PAYINS', 'read');
	const csv = buildResultsCsv(params.uploadId);
	if (!csv) {
		throw error(404, 'Results file not found');
	}

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="batch-results-${params.uploadId}.csv"`
		}
	});
};
