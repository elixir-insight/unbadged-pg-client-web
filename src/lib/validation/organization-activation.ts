import { documentChoiceGroups, type DocumentType } from '$lib/data/mockData';
import { MAX_UPLOAD_FILE_SIZE_BYTES, MAX_UPLOAD_FILE_SIZE_LABEL } from './file-upload';

const businessCertificateTypes: DocumentType[] =
	documentChoiceGroups.find((group) => group.key === 'businessCertificate')?.options ?? [];

export type OrganizationActivationInput = {
	apiKey: string;
	saltKey: string;
	businessCertificateType: string;
	file: File | null;
};

export type OrganizationActivationField =
	| 'apiKey'
	| 'saltKey'
	| 'businessCertificateType'
	| 'businessCertificate';

export type OrganizationActivationErrors = Partial<Record<OrganizationActivationField, string>>;

export function validateOrganizationActivation(input: OrganizationActivationInput): {
	valid: boolean;
	errors: OrganizationActivationErrors;
} {
	const errors: OrganizationActivationErrors = {};

	if (!input.apiKey.trim()) {
		errors.apiKey = 'API key is required';
	}

	if (!input.saltKey.trim()) {
		errors.saltKey = 'Salt key is required';
	}

	if (!input.businessCertificateType.trim()) {
		errors.businessCertificateType = 'Business certificate type is required';
	} else if (!businessCertificateTypes.includes(input.businessCertificateType as DocumentType)) {
		errors.businessCertificateType = 'Select a valid business certificate type';
	}

	if (!input.file || input.file.size === 0) {
		errors.businessCertificate = 'Business certificate file is required';
	} else if (input.file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
		errors.businessCertificate = `File exceeds the maximum size of ${MAX_UPLOAD_FILE_SIZE_LABEL}`;
	}

	return {
		valid: Object.keys(errors).length === 0,
		errors
	};
}
