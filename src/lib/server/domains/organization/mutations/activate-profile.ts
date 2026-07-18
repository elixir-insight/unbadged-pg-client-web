import type { Logger } from 'pino';
import { validateOrganizationActivation } from '$lib/validation/organization-activation';
import { mutationFailure, type MutationResult } from './types';

export type ActivateProfileSuccess = {
	redirectPath: string;
};

export async function activateProfileMutation(params: {
	log: Logger;
	orgId: string;
	category: string;
	formData: FormData;
}): Promise<MutationResult<ActivateProfileSuccess>> {
	const orgId = params.orgId.trim();
	if (!orgId) {
		return mutationFailure(400, 'Organization id is required');
	}

	const apiKey = String(params.formData.get('apiKey') ?? '');
	const saltKey = String(params.formData.get('saltKey') ?? '');
	const businessCertificateType = String(params.formData.get('businessCertificateType') ?? '');
	const fileEntry = params.formData.get('businessCertificate');

	const validation = validateOrganizationActivation({
		apiKey,
		saltKey,
		businessCertificateType,
		file: fileEntry instanceof File ? fileEntry : null
	});

	if (!validation.valid) {
		const firstError = Object.values(validation.errors)[0] ?? 'Invalid activation payload';
		return mutationFailure(400, firstError);
	}

	// TODO: wire upstream API
	// 1. Upload business certificate via POST .../documents (field from formDataFieldName)
	// 2. Call activate/credentials endpoint with apiKey + saltKey

	params.log.info({ orgId, category: params.category }, 'mock activate profile success');

	const redirectPath =
		params.category === 'PARTNER'
			? `/management/organizations/${orgId}/activate/partner`
			: `/management/organizations/${orgId}/activate/merchant`;

	return {
		ok: true,
		redirectPath
	};
}
