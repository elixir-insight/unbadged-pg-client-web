import type { Logger } from 'pino';
import { organizationClient } from '$lib/server/domains/organization/client';
import {
	MAX_UPLOAD_FILE_SIZE_BYTES,
	MAX_UPLOAD_FILE_SIZE_LABEL
} from '$lib/validation/file-upload';
import { isSessionFailure, requireSession } from './session';
import { mutationFailure, upstreamErrorToFailure, type MutationResult } from './types';

const backendFieldNameMap: Record<string, string> = {
	AADHAR_CARD: 'aadharCard',
	PAN_CARD: 'panCard',
	UDYAM_CERTIFICATE: 'udyamCertificate',
	MSME_CERTIFICATE: 'msmeCertificate',
	GST_CERTIFICATE: 'gstCertificate',
	INCORP_CERTIFICATE: 'incorpCertificate',
	BUSINESS_PAN: 'businessPan',
	BUSINESS_PAN_CARD: 'businessPan',
	BUSINESS_TAN: 'businessTan',
	FUNDS_ATTESTATION: 'fundsAttestation',
	UBO_DECLARATION: 'uboDeclaration',
	BOARD_RESOLUTION_FOR_AUTHORIZED_SIGNATORY: 'brDocument',
	RENTAL_AGREEMENT: 'rentalAgreement',
	ELECTRICITY_BILL: 'electricityBill',
	AOA: 'aoa',
	ARTICLE_OF_ASSOCIATION_AOA: 'aoa',
	MOA: 'moa',
	MEMORANDUM_OF_ASSOCIATION_MOA: 'moa',
	ORG_LOGO: 'orgLogo',
	PROFILE_PICTURE: 'profilePicture',
	APK_FILE: 'apkFile',
	VOIDED_CHEQUE: 'voidedCheque',
	BANK_STATEMENT: 'bankStatement',
	BANK_STATEMENT_LAST_3_MONTHS: 'bankStatement'
};

function normalizeUploadFieldName(fieldName: string): string {
	const trimmed = fieldName.trim();
	const directorMatch = trimmed.match(/^DIRECTOR_([^_]+)_(.+)$/i);

	if (directorMatch) {
		const directorId = directorMatch[1];
		const suffix = backendFieldNameMap[directorMatch[2].toUpperCase()] ?? directorMatch[2];
		return `DIRECTOR_${directorId}_${suffix}`;
	}

	return backendFieldNameMap[trimmed.toUpperCase()] ?? trimmed;
}

export function remapUploadFormData(formData: FormData): FormData {
	const remapped = new FormData();

	for (const [fieldName, value] of formData.entries()) {
		remapped.append(normalizeUploadFieldName(fieldName), value);
	}

	return remapped;
}

function findOversizedFileField(formData: FormData): string | null {
	for (const [fieldName, value] of formData.entries()) {
		if (value instanceof File && value.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
			return fieldName;
		}
	}

	return null;
}

const allowedDirectorDocumentFields = new Set(['aadhar', 'pan']);

function validateDirectorUploadFormData(formData: FormData): string | null {
	const entries = [...formData.entries()];
	if (entries.length === 0) {
		return 'At least one document file is required';
	}

	for (const [fieldName, value] of entries) {
		if (!allowedDirectorDocumentFields.has(fieldName)) {
			return `Invalid document field: ${fieldName}`;
		}
		if (!(value instanceof File) || value.size === 0) {
			return `${fieldName} must be a non-empty file`;
		}
	}

	return null;
}

export type UploadDocumentsSuccess = {
	message: string;
};

export async function uploadOrgDocumentsMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	formData: FormData;
}): Promise<MutationResult<UploadDocumentsSuccess>> {
	const orgId = params.orgId.trim();
	if (!orgId) {
		return mutationFailure(400, 'Organization id is required');
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const oversizedField = findOversizedFileField(params.formData);
	if (oversizedField) {
		params.log.warn(
			`upload documents rejected — ${oversizedField} exceeds ${MAX_UPLOAD_FILE_SIZE_LABEL}`
		);
		return mutationFailure(
			400,
			`${oversizedField} exceeds the maximum file size of ${MAX_UPLOAD_FILE_SIZE_LABEL}`
		);
	}

	const remappedFormData = remapUploadFormData(params.formData);
	if (params.log.isLevelEnabled('debug')) {
		const fieldNames = [...remappedFormData.keys()];
		params.log.debug({ orgId, fieldNames }, 'upload organization documents — multipart fields');
	}
	const result = await organizationClient.uploadDocuments(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		remappedFormData
	);

	if (!result.ok) {
		params.log.warn(
			{
				orgId,
				exceptionCode: result.error.kind === 'http' ? result.error.code : undefined,
				message: result.error.message
			},
			'upload organization documents failed'
		);
		return upstreamErrorToFailure(result.error);
	}

	return {
		ok: true,
		message: result.data.message ?? 'Documents uploaded successfully'
	};
}

export async function uploadDirectorDocumentsMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof requireSession>[0]['cookies'];
	orgId: string;
	directorId: string;
	formData: FormData;
}): Promise<MutationResult<UploadDocumentsSuccess>> {
	const orgId = params.orgId.trim();
	const directorId = params.directorId.trim();

	if (!orgId) {
		return mutationFailure(400, 'Organization id is required');
	}
	if (!directorId) {
		return mutationFailure(400, 'Director id is required');
	}

	const session = await requireSession({
		cookies: params.cookies,
		fetch: params.fetch,
		log: params.log
	});
	if (isSessionFailure(session)) return session;

	const validationError = validateDirectorUploadFormData(params.formData);
	if (validationError) {
		params.log.warn({ validationError }, 'upload director documents rejected — invalid form data');
		return mutationFailure(400, validationError);
	}

	const oversizedField = findOversizedFileField(params.formData);
	if (oversizedField) {
		params.log.warn(
			`upload director documents rejected — ${oversizedField} exceeds ${MAX_UPLOAD_FILE_SIZE_LABEL}`
		);
		return mutationFailure(
			400,
			`${oversizedField} exceeds the maximum file size of ${MAX_UPLOAD_FILE_SIZE_LABEL}`
		);
	}

	const result = await organizationClient.uploadDirectorDocuments(
		params.fetch,
		params.log,
		session.accessToken,
		session.gatewayToken,
		orgId,
		directorId,
		params.formData
	);

	if (!result.ok) {
		params.log.warn(
			{
				orgId,
				directorId,
				fieldNames: [...params.formData.keys()],
				exceptionCode: result.error.kind === 'http' ? result.error.code : undefined,
				message: result.error.message
			},
			'upload director documents failed'
		);
		return upstreamErrorToFailure(result.error);
	}

	return {
		ok: true,
		message: result.data.message ?? 'Director documents uploaded successfully'
	};
}
