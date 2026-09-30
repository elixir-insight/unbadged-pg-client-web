/**
 * Approve-flow profile form: validation and the PATCH .../organization/{orgId}/profile body.
 * Service type keys match the create flow's MerchantConfigSection ('Pay-Ins' / 'Payouts').
 */

export type ProfileType = 'MERCHANT' | 'PARTNER' | 'PLATFORM';

export interface ProfileFormInput {
	profileType: ProfileType | '';
	selectedServiceTypes: string[];
	servicePipelines: Record<string, string>;
	affiliateId: string;
}

export interface UpdateProfilePayload {
	profileType: ProfileType;
	serviceTypes?: { serviceType: 'PAYIN' | 'PAYOUT'; bankPipelineCodes: string[] }[];
	affiliateId?: string;
}

const SERVICE_TYPE_CODES: Record<string, 'PAYIN' | 'PAYOUT'> = {
	'Pay-Ins': 'PAYIN',
	Payouts: 'PAYOUT'
};

/** Error keys match MerchantConfigSection so errors render inline next to each field. */
export function validateProfileForm(input: ProfileFormInput): Record<string, string> {
	const errors: Record<string, string> = {};

	if (!input.profileType) {
		errors.profileType = 'Select a profile type';
		return errors;
	}

	if (input.profileType !== 'MERCHANT') return errors;

	if (input.selectedServiceTypes.length === 0) {
		errors.serviceTypes = 'Select at least one service type';
	}
	for (const serviceType of input.selectedServiceTypes) {
		if (!input.servicePipelines[serviceType]?.trim()) {
			errors[`bankPipeline_${serviceType}`] = 'Select a bank pipeline';
		}
	}

	return errors;
}

/** Call only after validateProfileForm returned no errors. */
export function buildProfilePayload(input: ProfileFormInput): UpdateProfilePayload {
	if (!input.profileType) throw new Error('Profile type is required');

	const payload: UpdateProfilePayload = { profileType: input.profileType };

	if (input.profileType === 'MERCHANT') {
		payload.serviceTypes = input.selectedServiceTypes.flatMap((label) => {
			const serviceType = SERVICE_TYPE_CODES[label];
			const pipelineCode = input.servicePipelines[label]?.trim();
			return serviceType && pipelineCode
				? [{ serviceType, bankPipelineCodes: [pipelineCode] }]
				: [];
		});
	}

	const affiliateId = input.affiliateId.trim();
	if (affiliateId) payload.affiliateId = affiliateId;

	return payload;
}

export interface ProfileFormOption {
	value: string;
	label: string;
}

/** Static choices for the approve popup; the route supplies them since pipelines come from its load. */
export interface ProfileFormOptions {
	availableServiceTypes: {
		value: string;
		label: string;
		icon: import('svelte').Component;
		desc: string;
	}[];
	bankPipelinesByService: Record<string, ProfileFormOption[]>;
	affiliatesByPipeline: Record<string, ProfileFormOption[]>;
	pipelinesError: string | null;
}

/** Affiliates offered for the chosen pipelines — same rule as MerchantConfigSection. */
export function affiliateIdsFor(
	input: Pick<ProfileFormInput, 'selectedServiceTypes' | 'servicePipelines'>,
	affiliatesByPipeline: Record<string, ProfileFormOption[]>
): Set<string> {
	const pipelines = input.selectedServiceTypes
		.map((serviceType) => input.servicePipelines[serviceType])
		.filter((pipeline): pipeline is string => Boolean(pipeline));
	return new Set(
		pipelines.flatMap((pipeline) => (affiliatesByPipeline[pipeline] ?? []).map((a) => a.value))
	);
}
