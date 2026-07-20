import { describe, expect, it } from 'vitest';
import { documentStatusLabel, documentStatusVariant } from './document-upload-state';

describe('document upload state helpers', () => {
	it('shows uploading and error labels from upload state', () => {
		expect(documentStatusLabel('Pending', { phase: 'uploading', progress: 50 })).toBe('Uploading');
		expect(documentStatusLabel('Pending', { phase: 'error', message: 'Failed' })).toBe(
			'Upload failed'
		);
	});

	it('shows uploaded label when upload succeeded', () => {
		expect(documentStatusLabel('Uploaded', { phase: 'idle' })).toBe('Uploaded');
	});

	it('uses error variant for failed uploads', () => {
		expect(documentStatusVariant('Pending', { phase: 'error', message: 'Failed' })).toBe('error');
	});
});
