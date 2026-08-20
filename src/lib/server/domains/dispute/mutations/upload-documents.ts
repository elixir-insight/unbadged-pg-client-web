import type { Logger } from 'pino';
import {
	isSessionFailure,
	requireSession
} from '$lib/server/domains/organization/mutations/session';
import {
	mutationFailure,
	upstreamErrorToFailure,
	type MutationResult
} from '$lib/server/domains/organization/mutations/types';
import {
	MAX_UPLOAD_FILE_SIZE_BYTES,
	MAX_UPLOAD_FILE_SIZE_LABEL
} from '$lib/validation/file-upload';
import { disputeClient } from '../client';
import {
	DISPUTE_DOCUMENT_TYPES,
	type DisputeDocumentItem,
	type DisputeDocumentType,
	type DisputeDocumentUploadFailure
} from '../schema';

const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png']);

export type UploadDisputeDocumentsSuccess = {
	message: string;
	uploaded: DisputeDocumentItem[];
	failed: DisputeDocumentUploadFailure[];
};

function isDisputeDocumentType(value: string): value is DisputeDocumentType {
	return (DISPUTE_DOCUMENT_TYPES as readonly string[]).includes(value);
}

export async function uploadDisputeDocumentsMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	disputeId: string;
	formData: FormData;
}): Promise<MutationResult<UploadDisputeDocumentsSuccess>> {
	const orgId = params.orgId.trim();
	const disputeId = params.disputeId.trim();

	if (!orgId) {
		return mutationFailure(400, 'Organization id is required');
	}
	if (!disputeId) {
		return mutationFailure(400, 'Dispute id is required');
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const documentTypeRaw = params.formData.get('documentType');
	const documentType =
		typeof documentTypeRaw === 'string' ? documentTypeRaw.trim().toUpperCase() : '';
	if (!isDisputeDocumentType(documentType)) {
		return mutationFailure(
			400,
			'documentType must be MERCHANT_PROOF, AGGREGATOR_CORRESPONDENCE, or FINAL_RESOLUTION_DOC'
		);
	}

	const files = params.formData
		.getAll('files')
		.filter((entry): entry is File => entry instanceof File && entry.size > 0);

	if (files.length === 0) {
		return mutationFailure(400, 'At least one file is required');
	}

	for (const file of files) {
		const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
		if (!ALLOWED_EXTENSIONS.has(extension)) {
			return mutationFailure(400, `${file.name} is not a supported file type`);
		}
		if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
			return mutationFailure(
				400,
				`${file.name} exceeds the maximum file size of ${MAX_UPLOAD_FILE_SIZE_LABEL}`
			);
		}
	}

	const upstreamFormData = new FormData();
	upstreamFormData.append('documentType', documentType);
	for (const file of files) {
		upstreamFormData.append('files', file, file.name);
	}

	params.log.info(
		{
			orgId,
			disputeId,
			documentType,
			fileCount: files.length,
			fileNames: files.map((file) => file.name)
		},
		'upload dispute documents — PUT upstream'
	);

	const result = await disputeClient.uploadDocuments(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		disputeId,
		upstreamFormData
	);

	if (!result.ok) {
		params.log.warn(
			{ orgId, disputeId, message: result.error.message, kind: result.error.kind },
			'upload dispute documents — upstream failed'
		);
		return upstreamErrorToFailure(result.error);
	}

	const payload = result.data.data[0];
	const uploaded = payload?.uploaded ?? [];
	const failed = payload?.failed ?? [];

	params.log.info(
		{
			orgId,
			disputeId,
			documentType,
			uploadedCount: uploaded.length,
			failedCount: failed.length,
			upstreamMessage: result.data.message
		},
		'upload dispute documents — success'
	);

	return {
		ok: true,
		message: result.data.message ?? 'Documents uploaded successfully',
		uploaded,
		failed
	};
}
