const KNOWN_DOCUMENT_FIELDS: Record<string, string> = {
	aadharcard: 'AADHAR_CARD',
	pancard: 'PAN_CARD',
	udyamcertificate: 'UDYAM_CERTIFICATE',
	msmecertificate: 'MSME_CERTIFICATE',
	gstcertificate: 'GST_CERTIFICATE',
	incorporationcertificate: 'INCORP_CERTIFICATE',
	businesspancard: 'BUSINESS_PAN',
	businesstan: 'BUSINESS_TAN',
	fundsattestation: 'FUNDS_ATTESTATION',
	photoattestation: 'PHOTO_ATTESTATION',
	rentalagreement: 'RENTAL_AGREEMENT',
	electricitybill: 'ELECTRICITY_BILL',
	aoa: 'AOA',
	moa: 'MOA',
	ubodeclaration: 'UBO_DECLARATION',
	boardresolutionforauthorizedsignatory: 'BOARD_RESOLUTION_FOR_AUTHORIZED_SIGNATORY',
	organizationlogo: 'ORG_LOGO',
	profilepicture: 'PROFILE_PICTURE',
	apkfile: 'APK_FILE',
	cancelledcheque: 'VOIDED_CHEQUE',
	voidedcheque: 'VOIDED_CHEQUE',
	bankstatementlast3months: 'BANK_STATEMENT'
};

/** Maps a director document slot to the multipart field name the upload API expects. */
export function directorFormDataFieldName(
	field: 'aadharDocument' | 'panDocument'
): 'aadhar' | 'pan' {
	return field === 'aadharDocument' ? 'aadhar' : 'pan';
}

/** Maps a document type label (e.g. "PAN Card") to the multipart field name the upload API expects. */
export function formDataFieldName(documentType: string, directorId?: string): string {
	const normalized = documentType
		.replace(/\s+/g, '_')
		.replace(/[()]/g, '')
		.replace(/[^A-Za-z0-9_]/g, '')
		.trim();

	const key = normalized.replace(/_+/g, '').toLowerCase();
	const mappedField = KNOWN_DOCUMENT_FIELDS[key] ?? normalized.toUpperCase();
	return directorId ? `DIRECTOR_${directorId.toUpperCase()}_${mappedField}` : mappedField;
}
