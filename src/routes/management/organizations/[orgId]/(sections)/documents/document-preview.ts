export type DocumentPreviewKind = 'image' | 'pdf' | 'unsupported';

export function getDocumentPreviewKind(
	fileType?: string,
	previewUrl?: string
): DocumentPreviewKind {
	const normalized = fileType?.trim().toLowerCase() ?? '';
	if (normalized.startsWith('image/')) return 'image';
	if (normalized === 'application/pdf') return 'pdf';

	if (previewUrl) {
		try {
			const pathname = new URL(previewUrl).pathname.toLowerCase();
			if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(pathname)) return 'image';
			if (pathname.endsWith('.pdf')) return 'pdf';
		} catch {
			// ignore invalid preview URLs
		}
	}

	return 'unsupported';
}

export function hasDocumentPreview(document: { previewUrl?: string; status: string }): boolean {
	if (!document.previewUrl?.trim()) return false;
	return (
		document.status === 'Uploaded' ||
		document.status === 'In Review' ||
		document.status === 'Approved'
	);
}
