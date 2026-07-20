import { fail } from '@sveltejs/kit';
import { MAX_UPLOAD_FILE_SIZE_LABEL } from '$lib/validation/file-upload';

function isPayloadTooLarge(error: Error): boolean {
	const message = error.message.toLowerCase();
	return (
		message.includes('payload too large') ||
		message.includes('body_size_limit') ||
		message.includes('exceeds limit') ||
		message.includes('invalid request body')
	);
}

export function failUploadAction(error: unknown) {
	if (error instanceof Error && isPayloadTooLarge(error)) {
		return fail(413, {
			message: `File exceeds the server upload limit. Maximum allowed size is ${MAX_UPLOAD_FILE_SIZE_LABEL}.`
		});
	}

	if (error instanceof Error && error.message.trim()) {
		return fail(500, { message: error.message });
	}

	return fail(500, { message: 'Upload failed. Please try again.' });
}
