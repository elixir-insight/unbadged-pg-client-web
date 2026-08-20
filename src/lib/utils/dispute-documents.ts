export type DocumentReviewStatus = 'accepted' | 'pending' | 'rejected';

export type DisputeDocumentType =
	'MERCHANT_PROOF' | 'AGGREGATOR_CORRESPONDENCE' | 'FINAL_RESOLUTION_DOC';

export interface DisputeDocumentView {
	id: string;
	fileName: string;
	fileSizeBytes: number;
	createdAt: string;
	shownToMerchant: boolean;
	reviewStatus: DocumentReviewStatus;
	reviewNote: string;
}

export interface DisputeDocumentsByType {
	merchantProof: DisputeDocumentView[];
	aggregatorCorrespondence: DisputeDocumentView[];
	finalResolutionDoc: DisputeDocumentView[];
}

export function mapDocumentReviewStatus(status: string | undefined): DocumentReviewStatus {
	const normalized = (status ?? '').trim().toUpperCase();
	if (normalized === 'ACCEPTED' || normalized === 'APPROVED') return 'accepted';
	if (normalized === 'REJECTED') return 'rejected';
	return 'pending';
}

export function toApiDocumentReviewStatus(status: DocumentReviewStatus): string {
	return status.toUpperCase();
}

export function emptyDisputeDocumentsByType(): DisputeDocumentsByType {
	return {
		merchantProof: [],
		aggregatorCorrespondence: [],
		finalResolutionDoc: []
	};
}
