import { describe, expect, it } from 'vitest';
import { uploadErrorDetails } from './upload-error';

const message = 'One or more documents failed to upload';

describe('uploadErrorDetails', () => {
	it('reads per-file reasons from data[]', () => {
		expect(
			uploadErrorDetails({
				message,
				data: [{ fieldName: 'aadhar', error: 'Unsupported file type' }]
			})
		).toEqual(['Unsupported file type']);
	});

	it('reads an errors array of strings', () => {
		expect(uploadErrorDetails({ message, errors: ['File too large'] })).toEqual(['File too large']);
	});

	it('ignores a detail that only repeats the message', () => {
		expect(uploadErrorDetails({ message, error: message })).toEqual([]);
	});

	it('returns nothing for a body without details', () => {
		expect(uploadErrorDetails({ message, statusCode: 500 })).toEqual([]);
		expect(uploadErrorDetails(null)).toEqual([]);
	});
});
