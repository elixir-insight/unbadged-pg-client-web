import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { organizationClient } from '$lib/server/domains/organization/client';
import {
	MAX_UPLOAD_FILE_SIZE_BYTES,
	MAX_UPLOAD_FILE_SIZE_LABEL
} from '$lib/validation/file-upload';

const allowedDirectorDocumentFields = new Set(['aadhar', 'pan']);

function findOversizedFileField(formData: FormData): string | null {
	for (const [fieldName, value] of formData.entries()) {
		if (value instanceof File && value.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
			return fieldName;
		}
	}

	return null;
}

function validateDirectorUploadFormData(formData: FormData): string | null {
	const entries = [...formData.entries()];
	if (entries.length === 0) {
		return 'At least one document file is required';
	}

	for (const [fieldName, value] of entries) {
		if (!allowedDirectorDocumentFields.has(fieldName)) {
			return `Invalid document field: ${fieldName}`;
		}
		if (!(value instanceof File) || value.size === 0) {
			return `${fieldName} must be a non-empty file`;
		}
	}

	return null;
}

export const POST: RequestHandler = async ({ params, request, cookies, fetch, locals }) => {
	const log = locals.logger;
	const orgId = params.orgId?.trim();
	const directorId = params.directorId?.trim();

	if (!orgId) {
		error(400, 'Organization id is required');
	}

	if (!directorId) {
		error(400, 'Director id is required');
	}

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			error(401, e.message);
		}
		throw e;
	}

	const formData = await request.formData().catch(() => null);
	if (!formData) {
		log.warn('upload director documents rejected — invalid multipart form data');
		error(400, 'Invalid multipart form data');
	}

	const validationError = validateDirectorUploadFormData(formData);
	if (validationError) {
		log.warn({ validationError }, 'upload director documents rejected — invalid form data');
		error(400, validationError);
	}

	const oversizedField = findOversizedFileField(formData);
	if (oversizedField) {
		log.warn(
			`upload director documents rejected — ${oversizedField} exceeds ${MAX_UPLOAD_FILE_SIZE_LABEL}`
		);
		error(400, `${oversizedField} exceeds the maximum file size of ${MAX_UPLOAD_FILE_SIZE_LABEL}`);
	}

	const result = await organizationClient.uploadDirectorDocuments(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId,
		directorId,
		formData
	);

	if (!result.ok) {
		const status = result.error.kind === 'http' ? result.error.status : 502;
		return json(
			{
				message: result.error.message,
				exceptionCode: result.error.kind === 'http' ? result.error.code : undefined,
				statusCode: status
			},
			{ status }
		);
	}

	return json({
		message: result.data.message ?? 'Director documents uploaded successfully',
		statusCode: result.data.statusCode ?? 200,
		data: result.data.data
	});
};
