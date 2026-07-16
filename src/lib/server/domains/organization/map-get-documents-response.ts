import type {
	DocumentStatus,
	Organization,
	OrganizationDirector,
	OrganizationDocument
} from '$lib/data/mockData';
import { parseDocumentFileName, type DirectorDocumentField } from './document-field-names';
import type { OrganizationDocumentRecord } from './schema';

function asString(value: unknown, fallback = ''): string {
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number' && Number.isFinite(value)) return String(value);
	return fallback;
}

function uploadedDateFromCreatedAt(createdAt: string | undefined): string | undefined {
	if (!createdAt?.trim()) return undefined;
	return createdAt.slice(0, 10);
}

function displayFileName(record: OrganizationDocumentRecord): string {
	if (record.preSignedUrl) {
		try {
			const pathname = new URL(record.preSignedUrl).pathname;
			const basename = pathname.split('/').pop();
			if (basename) return decodeURIComponent(basename.split('?')[0] ?? basename);
		} catch {
			// fall through
		}
	}

	const extension = record.fileType?.split('/').pop();
	if (extension && extension !== 'octet-stream') {
		return `${record.fileName}.${extension}`;
	}

	return record.fileName;
}

function toUploadedDocument(
	record: OrganizationDocumentRecord,
	documentType: OrganizationDocument['documentType'],
	extras?: Pick<OrganizationDocument, 'optional' | 'activationGate'>
): OrganizationDocument {
	return {
		id: asString(record.id),
		documentType,
		fileName: displayFileName(record),
		uploadedDate: uploadedDateFromCreatedAt(record.createdAt),
		status: 'Uploaded' satisfies DocumentStatus,
		previewUrl: record.preSignedUrl,
		fileType: record.fileType,
		...extras
	};
}

function toDirectorDocument(
	record: OrganizationDocumentRecord
): Pick<
	OrganizationDocument,
	'id' | 'fileName' | 'uploadedDate' | 'status' | 'previewUrl' | 'fileType'
> {
	return {
		id: asString(record.id),
		fileName: displayFileName(record),
		uploadedDate: uploadedDateFromCreatedAt(record.createdAt),
		status: 'Uploaded',
		previewUrl: record.preSignedUrl,
		fileType: record.fileType
	};
}

function upsertOrganizationDocument(
	documents: OrganizationDocument[],
	next: OrganizationDocument
): OrganizationDocument[] {
	const index = documents.findIndex((document) => document.documentType === next.documentType);
	if (index === -1) return [...documents, next];
	return documents.map((document, documentIndex) => (documentIndex === index ? next : document));
}

function directorIdsMatch(left: string, right: string): boolean {
	return left.trim().toUpperCase() === right.trim().toUpperCase();
}

function resolveDirectorId(
	directors: OrganizationDirector[],
	parsedDirectorId: string,
	field: DirectorDocumentField
): string | null {
	if (parsedDirectorId) {
		const match = directors.find((director) => directorIdsMatch(director.id, parsedDirectorId));
		return match?.id ?? null;
	}

	const pendingDirector = directors.find((director) => director[field].status === 'Pending');
	return pendingDirector?.id ?? directors[0]?.id ?? null;
}

function applyDirectorDocument(
	directors: OrganizationDirector[],
	directorId: string,
	field: DirectorDocumentField,
	document: Pick<
		OrganizationDocument,
		'id' | 'fileName' | 'uploadedDate' | 'status' | 'previewUrl' | 'fileType'
	>
): OrganizationDirector[] {
	return directors.map((director) =>
		director.id === directorId
			? {
					...director,
					[field]: document
				}
			: director
	);
}

export function mapGetDocumentsResponse(
	items: OrganizationDocumentRecord[],
	organization: Pick<Organization, 'documents' | 'directors'>
): { documents: OrganizationDocument[]; directors: OrganizationDirector[] } {
	let documents = [...(organization.documents ?? [])];
	let directors = [...(organization.directors ?? [])];

	for (const item of items) {
		const parsed = parseDocumentFileName(item.fileName);
		if (!parsed) continue;

		if (parsed.kind === 'organization') {
			const extras =
				parsed.documentType === 'Organization logo'
					? ({ optional: true } satisfies Pick<OrganizationDocument, 'optional'>)
					: undefined;
			documents = upsertOrganizationDocument(
				documents,
				toUploadedDocument(item, parsed.documentType, extras)
			);
			continue;
		}

		const directorId = resolveDirectorId(directors, parsed.directorId, parsed.field);
		if (!directorId) continue;

		directors = applyDirectorDocument(
			directors,
			directorId,
			parsed.field,
			toDirectorDocument(item)
		);
	}

	return { documents, directors };
}
