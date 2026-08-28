import {
	emptyDisputeDocumentsByType,
	mapDocumentReviewStatus,
	type DisputeDocumentView,
	type DisputeDocumentsByType
} from '$lib/utils/dispute-documents';
import type { DisputeDocumentItem, DisputeDocumentsGrouped } from '../../schema';

function asText(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return '';
	return String(value).trim();
}

export function mapDisputeDocumentItem(item: DisputeDocumentItem): DisputeDocumentView {
	return {
		id: asText(item.documentId),
		fileName: asText(item.fileName) || 'document',
		fileSizeBytes: item.fileSizeBytes ?? 0,
		createdAt: asText(item.createdAt),
		shownToMerchant: Boolean(item.visibleToMerchant),
		reviewStatus: mapDocumentReviewStatus(asText(item.reviewStatus)),
		reviewNote: asText(item.reviewNote)
	};
}

function mapDocumentList(items: DisputeDocumentItem[] | null | undefined): DisputeDocumentView[] {
	if (!items?.length) return [];
	return items.filter((item) => asText(item.documentId)).map(mapDisputeDocumentItem);
}

export function mapDisputeDocumentsGrouped(
	grouped: DisputeDocumentsGrouped | null | undefined
): DisputeDocumentsByType {
	if (!grouped) return emptyDisputeDocumentsByType();

	return {
		merchantProof: mapDocumentList(grouped.merchantProof),
		aggregatorCorrespondence: mapDocumentList(grouped.aggregatorCorrespondence),
		finalResolutionDoc: mapDocumentList(grouped.finalResolutionDoc)
	};
}
