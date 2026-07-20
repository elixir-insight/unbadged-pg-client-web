import type { BadgeVariant } from '$lib/components/ui/badge';
import type { DocumentStatus } from '$lib/data/mockData';

export type DocumentUploadState =
	| { phase: 'idle' }
	| { phase: 'uploading'; progress: number | null }
	| { phase: 'error'; message: string };

export const idleUploadState: DocumentUploadState = { phase: 'idle' };

export function getDocumentUploadState(
	states: Record<string, DocumentUploadState>,
	documentId: string
): DocumentUploadState {
	return states[documentId] ?? idleUploadState;
}

export function documentStatusLabel(
	status: DocumentStatus,
	uploadState: DocumentUploadState
): string {
	if (uploadState.phase === 'uploading') return 'Uploading';
	if (uploadState.phase === 'error') return 'Upload failed';
	if (status === 'Uploaded') return 'Uploaded';
	return status;
}

export function documentStatusVariant(
	status: DocumentStatus,
	uploadState: DocumentUploadState
): BadgeVariant {
	if (uploadState.phase === 'uploading') return 'secondary';
	if (uploadState.phase === 'error') return 'error';
	if (status === 'Uploaded' || status === 'Approved') return 'success';
	if (status === 'Rejected') return 'error';
	return 'warning';
}

export function isUploadedDocumentStatus(status: DocumentStatus): boolean {
	return status === 'Uploaded' || status === 'In Review' || status === 'Approved';
}
