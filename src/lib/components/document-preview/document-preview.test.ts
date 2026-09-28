import { describe, expect, it } from 'vitest';
import { getDocumentPreviewKind, hasDocumentPreview } from './document-preview';

describe('document preview helpers', () => {
	it('detects image previews from mime type', () => {
		expect(getDocumentPreviewKind('image/png', '')).toBe('image');
	});

	it('detects pdf previews from mime type', () => {
		expect(getDocumentPreviewKind('application/pdf', '')).toBe('pdf');
	});

	it('falls back to file extension in preview URL', () => {
		expect(
			getDocumentPreviewKind(undefined, 'http://localhost:9000/bucket/file.pdf?signature=abc')
		).toBe('pdf');
	});

	it('allows preview only for uploaded documents with a URL', () => {
		expect(
			hasDocumentPreview({
				previewUrl: 'http://example.com/doc.png',
				status: 'Uploaded'
			})
		).toBe(true);
		expect(
			hasDocumentPreview({
				previewUrl: 'http://example.com/doc.png',
				status: 'Pending'
			})
		).toBe(false);
	});
});
