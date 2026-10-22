import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadDisputeDocumentsMutation } from '$lib/server/domains/dispute/mutations/upload-documents';

export const PUT: RequestHandler = async ({ params, request, cookies, locals, fetch }) => {
	const orgId = params.orgId?.trim() ?? '';
	const disputeId = params.disputeId?.trim() ?? '';
	const log = locals.logger.child({ action: 'disputes-upload-documents' });

	if (!orgId) {
		return json({ message: 'Organization id is required' }, { status: 400 });
	}

	if (!disputeId) {
		return json({ message: 'Dispute id is required' }, { status: 400 });
	}

	const contentType = request.headers.get('content-type') ?? '';
	if (!contentType.toLowerCase().includes('multipart/form-data')) {
		return json({ message: 'Expected multipart form data' }, { status: 400 });
	}

	const formData = await request.formData().catch(() => null);
	if (!formData) {
		return json({ message: 'Invalid document upload payload' }, { status: 400 });
	}

	const result = await uploadDisputeDocumentsMutation({
		fetch,
		log,
		cookies,
		orgId,
		disputeId,
		formData,
		portal: 'management'
	});

	if (!result.ok) {
		log.warn(
			{ orgId, disputeId, status: result.status, message: result.message },
			'upload dispute documents — PUT failed'
		);
		return json({ message: result.message }, { status: result.status });
	}

	log.info(
		{
			orgId,
			disputeId,
			uploadedCount: result.uploaded.length,
			failedCount: result.failed.length,
			message: result.message
		},
		'upload dispute documents — PUT succeeded'
	);

	return json(
		{
			message: result.message,
			uploaded: result.uploaded,
			failed: result.failed
		},
		{ status: 201 }
	);
};
