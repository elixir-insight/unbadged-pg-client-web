export interface SavedOrgDocument {
	name: string;
	type: string;
	uploadedDate: string;
	status: string;
}

export type DocumentFormKey =
	| 'bizCert'
	| 'proofOfFunds'
	| 'rentalAgreement'
	| 'gstCert'
	| 'proprietorPhoto'
	| 'bizPan'
	| 'bizTan'
	| 'aoaCert'
	| 'moaCert';

export interface DirectorDocFiles {
	aadhaar: File | null;
	pan: File | null;
}

export interface DocumentFormState {
	docFiles: Record<DocumentFormKey, File | null>;
	bizCertType: string;
	proofOfFundsType: string;
	rentalAgreementType: string;
	directorDocFiles: Record<number, DirectorDocFiles>;
}

interface Director {
	id: number;
	name: string;
}

const EMPTY_DOC_FILES: Record<DocumentFormKey, File | null> = {
	bizCert: null,
	proofOfFunds: null,
	rentalAgreement: null,
	gstCert: null,
	proprietorPhoto: null,
	bizPan: null,
	bizTan: null,
	aoaCert: null,
	moaCert: null
};

const ORG_DOCUMENT_TYPE_MAP: Record<
	string,
	{ field: DocumentFormKey; subtype?: string; directorField?: keyof DirectorDocFiles }
> = {
	Incorporation: { field: 'bizCert', subtype: 'incorporation_certificate' },
	Tax: { field: 'gstCert' },
	'Bank Proof': { field: 'proofOfFunds', subtype: 'last_3_months_bank_statements' },
	'ID Proof': { field: 'bizCert', directorField: 'aadhaar' },
	Rental: { field: 'rentalAgreement', subtype: 'rental_agreement' },
	PAN: { field: 'bizPan', directorField: 'pan' },
	Aadhaar: { field: 'gstCert', directorField: 'aadhaar' },
	MOA: { field: 'moaCert' },
	AOA: { field: 'aoaCert' },
	TAN: { field: 'bizTan' }
};

function inferMimeType(fileName: string): string {
	if (/\.(png|jpg|jpeg|gif|webp)$/i.test(fileName)) return 'image/png';
	return 'application/pdf';
}

export function fileFromDocumentName(fileName: string, sizeInBytes = 512_000): File {
	return new File([new Uint8Array(sizeInBytes)], fileName, {
		type: inferMimeType(fileName)
	});
}

function inferMapping(doc: SavedOrgDocument): (typeof ORG_DOCUMENT_TYPE_MAP)[string] | null {
	const byType = ORG_DOCUMENT_TYPE_MAP[doc.type];
	if (byType) return byType;

	const name = doc.name.toLowerCase();
	if (name.includes('incorporation') || name.includes('business certificate')) {
		return { field: 'bizCert', subtype: 'incorporation_certificate' };
	}
	if (name.includes('gst') || name.includes('tax registration')) {
		return { field: 'gstCert' };
	}
	if (name.includes('bank') || name.includes('proof of funds') || name.includes('cheque')) {
		return { field: 'proofOfFunds', subtype: 'last_3_months_bank_statements' };
	}
	if (name.includes('rental') || name.includes('lease') || name.includes('electricity')) {
		return { field: 'rentalAgreement', subtype: 'rental_agreement' };
	}
	if (name.includes('proprietor') || name.includes('photo')) {
		return { field: 'proprietorPhoto' };
	}
	if (name.includes('moa') || name.includes('memorandum')) {
		return { field: 'moaCert' };
	}
	if (name.includes('aoa') || name.includes('article of association')) {
		return { field: 'aoaCert' };
	}
	if (name.includes('tan')) {
		return { field: 'bizTan' };
	}
	if (name.includes('director') && name.includes('id')) {
		return { field: 'bizCert', directorField: 'aadhaar' };
	}
	if (name.includes('aadhaar')) {
		return { field: 'gstCert', directorField: 'aadhaar' };
	}
	if (name.includes('pan')) {
		return { field: 'bizPan', directorField: 'pan' };
	}

	return null;
}

export function createEmptyDocumentFormState(directors: Director[]): DocumentFormState {
	return {
		docFiles: { ...EMPTY_DOC_FILES },
		bizCertType: 'incorporation_certificate',
		proofOfFundsType: 'last_3_months_bank_statements',
		rentalAgreementType: '',
		directorDocFiles: directors.reduce<Record<number, DirectorDocFiles>>((acc, director) => {
			acc[director.id] = { aadhaar: null, pan: null };
			return acc;
		}, {})
	};
}

export function buildDocumentFormState(
	documents: SavedOrgDocument[],
	directors: Director[]
): DocumentFormState {
	const state = createEmptyDocumentFormState(directors);
	const primaryDirectorId = directors[0]?.id;

	for (const doc of documents) {
		const mapping = inferMapping(doc);
		if (!mapping) continue;

		const file = fileFromDocumentName(doc.name);

		if (mapping.directorField && primaryDirectorId !== undefined) {
			state.directorDocFiles[primaryDirectorId] ??= { aadhaar: null, pan: null };
			state.directorDocFiles[primaryDirectorId][mapping.directorField] = file;
			continue;
		}

		if (state.docFiles[mapping.field] === null) {
			state.docFiles[mapping.field] = file;
		}

		if (mapping.subtype) {
			if (mapping.field === 'bizCert') state.bizCertType = mapping.subtype;
			if (mapping.field === 'proofOfFunds') state.proofOfFundsType = mapping.subtype;
			if (mapping.field === 'rentalAgreement') state.rentalAgreementType = mapping.subtype;
		}
	}

	return state;
}
