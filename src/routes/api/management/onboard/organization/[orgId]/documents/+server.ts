import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { organizationClient } from '$lib/server/domains/organization/client';
import {
	MAX_UPLOAD_FILE_SIZE_BYTES,
	MAX_UPLOAD_FILE_SIZE_LABEL
} from '$lib/validation/file-upload';

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

function remapUploadFormData(formData: FormData): FormData {
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

export const GET: RequestHandler = async ({ params, cookies, fetch, locals }) => {
	const log = locals.logger;
	const orgId = params.orgId?.trim();

	if (!orgId) {
		error(400, 'Organization id is required');
	}

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			error(401, e.message);
		}
		throw e;
	}

	const result = await organizationClient.getDocuments(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId
	);

	if (!result.ok) {
		const status = result.error.kind === 'http' ? result.error.status : 502;
		return json(
			{
				message: result.error.message,
				exceptionCode: result.error.kind === 'http' ? result.error.code : undefined,
				statusCode: status
			},
			{ status }
		);
	}

	return json({
		message: result.data.message ?? 'Documents fetched successfully',
		statusCode: result.data.statusCode ?? 200,
		data: result.data.data ?? []
	});
};

export const POST: RequestHandler = async ({ params, request, cookies, fetch, locals }) => {
	const log = locals.logger;
	const orgId = params.orgId?.trim();

	if (!orgId) {
		error(400, 'Organization id is required');
	}

	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (e) {
		if (e instanceof SessionInactiveError || e instanceof SessionError) {
			error(401, e.message);
		}
		throw e;
	}

	const formData = await request.formData().catch(() => null);
	if (!formData) {
		log.warn('upload documents rejected — invalid multipart form data');
		error(400, 'Invalid multipart form data');
	}

	const oversizedField = findOversizedFileField(formData);
	if (oversizedField) {
		log.warn(`upload documents rejected — ${oversizedField} exceeds ${MAX_UPLOAD_FILE_SIZE_LABEL}`);
		error(400, `${oversizedField} exceeds the maximum file size of ${MAX_UPLOAD_FILE_SIZE_LABEL}`);
	}

	const remappedFormData = remapUploadFormData(formData);
	const result = await organizationClient.uploadDocuments(
		fetch,
		log,
		tokens.accessToken,
		tokens.gatewayToken,
		orgId,
		remappedFormData
	);

	if (!result.ok) {
		const status = result.error.kind === 'http' ? result.error.status : 502;
		return json(
			{
				message: result.error.message,
				exceptionCode: result.error.kind === 'http' ? result.error.code : undefined,
				statusCode: status
			},
			{ status }
		);
	}

	return json({
		message: result.data.message ?? 'Documents uploaded successfully',
		statusCode: result.data.statusCode ?? 200,
		data: result.data.data
	});
};
