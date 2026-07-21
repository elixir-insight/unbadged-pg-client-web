import { resolve } from '$app/paths';
import type {
	BulkResult,
	BulkValidation,
	SearchByType,
	SingleResult
} from '$lib/types/check-status';

class CheckStatusApiError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}

async function parseResponse<T>(response: Response): Promise<T> {
	if (response.ok) {
		return (await response.json()) as T;
	}

	let message = 'Something went wrong. Please try again.';
	try {
		const body = (await response.json()) as { message?: string };
		if (body.message) message = body.message;
	} catch {
		message = response.statusText || message;
	}

	throw new CheckStatusApiError(message, response.status);
}

export async function checkTransactionStatus(
	searchBy: SearchByType,
	value: string
): Promise<SingleResult> {
	const response = await fetch(resolve('/api/transactions/status'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ searchBy, value })
	});

	return parseResponse<SingleResult>(response);
}

export async function uploadBulkCsv(
	file: File,
	searchBy: SearchByType,
	onProgress?: (percent: number) => void
): Promise<BulkValidation> {
	return new Promise((resolvePromise, reject) => {
		const xhr = new XMLHttpRequest();
		const formData = new FormData();
		formData.append('file', file);
		formData.append('searchBy', searchBy);

		xhr.upload.addEventListener('progress', (event) => {
			if (!event.lengthComputable) return;
			const percent = Math.round((event.loaded / event.total) * 100);
			onProgress?.(percent);
		});

		xhr.addEventListener('load', () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				try {
					resolvePromise(JSON.parse(xhr.responseText) as BulkValidation);
				} catch {
					reject(new CheckStatusApiError('Invalid server response', xhr.status));
				}
				return;
			}

			let message = 'Upload failed. Please try again.';
			try {
				const body = JSON.parse(xhr.responseText) as { message?: string };
				if (body.message) message = body.message;
			} catch {
				// keep default message
			}
			reject(new CheckStatusApiError(message, xhr.status));
		});

		xhr.addEventListener('error', () => {
			reject(new CheckStatusApiError('Network error during upload', 0));
		});

		xhr.addEventListener('abort', () => {
			reject(new CheckStatusApiError('Upload cancelled', 0));
		});

		xhr.open('POST', resolve('/api/transactions/bulk/upload'));
		xhr.send(formData);
	});
}

export async function processBulkBatch(uploadId: string): Promise<BulkResult> {
	const response = await fetch(resolve('/api/transactions/bulk/process'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ uploadId })
	});

	return parseResponse<BulkResult>(response);
}

export { CheckStatusApiError };
