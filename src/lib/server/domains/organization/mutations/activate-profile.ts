import type { Logger } from 'pino';
import { validateOrganizationActivation } from '$lib/validation/organization-activation';
import { updateOrganizationStatusMutation } from './update-status';
import { mutationFailure, type MutationResult } from './types';

export type ActivateProfileSuccess = {
	redirectPath: string;
};

export async function activateProfileMutation(params: {
	fetch: typeof fetch;
	log: Logger;
	cookies: Parameters<typeof updateOrganizationStatusMutation>[0]['cookies'];
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

	// TODO: upload business certificate and persist gateway credentials when upstream endpoints exist.
	const statusResult = await updateOrganizationStatusMutation({
		fetch: params.fetch,
		log: params.log,
		cookies: params.cookies,
		orgId,
		body: {
			profileStatus: 'ACTIVE',
			remarks: 'Profile activated'
		}
	});

	if (!statusResult.ok) {
		return statusResult;
	}

	params.log.info({ orgId, category: params.category }, 'organization profile activated');

	// No VAN creation for either category — go straight to commission/fee configuration.
	return {
		ok: true,
		redirectPath: `/management/organizations/${orgId}/activate/merchant`
	};
}
