import type { DocumentType } from '$lib/data/mockData';

/** Backend multipart / storage field names (camelCase) → UI document labels. */
export const backendFileNameToDocumentType: Record<string, DocumentType> = {
	gstCertificate: 'GST certificate',
	businessPan: 'Business PAN card',
	voidedCheque: 'Cancelled cheque',
	bankStatement: 'Bank statement (last 3 months)',
	rentalAgreement: 'Rental agreement',
	electricityBill: 'Electricity bill',
	incorpCertificate: 'Incorporation certificate',
	udyamCertificate: 'Udyam certificate',
	msmeCertificate: 'MSME certificate',
	businessTan: 'Business TAN',
	aoa: 'Article of Association (AOA)',
	moa: 'Memorandum of Association (MOA)',
	uboDeclaration: 'UBO Declaration',
	brDocument: 'Board Resolution for Authorized Signatory',
	orgLogo: 'Organization logo'
};

export type DirectorDocumentField = 'aadharDocument' | 'panDocument';

const directorBackendFieldMap: Record<string, DirectorDocumentField> = {
	aadharcard: 'aadharDocument',
	pancard: 'panDocument'
};

export type ParsedOrganizationDocumentField = {
	kind: 'organization';
	documentType: DocumentType;
};

export type ParsedDirectorDocumentField = {
	kind: 'director';
	directorId: string;
	field: DirectorDocumentField;
};

export type ParsedDocumentField =
	| ParsedOrganizationDocumentField
	| ParsedDirectorDocumentField
	| null;

/** Parses upstream `fileName` values returned by GET documents. */
export function parseDocumentFileName(fileName: string): ParsedDocumentField {
	const trimmed = fileName.trim();
	if (!trimmed) return null;

	const directorMatch = trimmed.match(/^DIRECTOR_(.+)_(aadharCard|panCard)$/i);
	if (directorMatch) {
		const field = directorBackendFieldMap[directorMatch[2].toLowerCase()];
		if (!field) return null;
		return {
			kind: 'director',
			directorId: directorMatch[1],
			field
		};
	}

	const orgDocumentType = backendFileNameToDocumentType[trimmed];
	if (orgDocumentType) {
		return { kind: 'organization', documentType: orgDocumentType };
	}

	const directorField = directorBackendFieldMap[trimmed.toLowerCase()];
	if (directorField) {
		return {
			kind: 'director',
			directorId: '',
			field: directorField
		};
	}

	return null;
}
