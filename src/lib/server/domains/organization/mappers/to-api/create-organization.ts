import * as v from 'valibot';
import { CreateOrganizationRequestSchema, type CreateOrganizationRequest } from '../../schema';
import { toE164IndianPhone } from '$lib/validation/organization-kyb';

const businessTypeLabelMap: Record<string, CreateOrganizationRequest['businessType']> = {
	'Sole Proprietorship': 'SOLE_PROPRIETORSHIP',
	Partnership: 'PARTNERSHIP',
	LLP: 'LIMITED_LIABILITY_PARTNERSHIP',
	'Private Limited': 'PRIVATE_LIMITED'
};

const serviceTypeLabelMap: Record<
	string,
	CreateOrganizationRequest['serviceTypes'][number]['serviceType']
> = {
	'Pay-Ins': 'PAYIN',
	Payouts: 'PAYOUT'
};

const profileTypeLabelMap = {
	MERCHANT: 'MERCHANT',
	PARTNER: 'PARTNER',
	PLATFORM: 'PLATFORM'
} as const;

export const CreateOrganizationFormBodySchema = v.pipe(
	v.object({
		selectedCategory: v.picklist(['Merchant', 'Partner']),
		profileType: v.optional(v.picklist(['', 'PARTNER', 'PLATFORM']), ''),
		orgName: v.pipe(v.string(), v.trim(), v.minLength(1, 'Organization name is required')),
		orgPhone: v.pipe(v.string(), v.trim(), v.minLength(1, 'Mobile number is required')),
		orgEmail: v.pipe(v.string(), v.trim(), v.email('Enter a valid email address')),
		orgBusinessType: v.pipe(v.string(), v.minLength(1, 'Business type is required')),
		affiliateId: v.optional(v.string(), ''),
		selectedServiceTypes: v.optional(v.array(v.string()), []),
		servicePipelines: v.optional(v.record(v.string(), v.string()), {})
	}),
	v.check(
		(input) =>
			input.selectedCategory !== 'Partner' ||
			input.profileType === 'PARTNER' ||
			input.profileType === 'PLATFORM',
		'Profile type is required'
	)
);

export type CreateOrganizationFormBody = v.InferOutput<typeof CreateOrganizationFormBodySchema>;

// Moved to the client-safe validation module (self-onboarding's shared payload builder needs it);
// re-exported so existing server imports keep working.
export { toE164IndianPhone };

export function resolveCreateOrganizationProfileType(
	input: Pick<CreateOrganizationFormBody, 'selectedCategory' | 'profileType'>
): CreateOrganizationRequest['profileType'] {
	if (input.selectedCategory === 'Merchant') {
		return profileTypeLabelMap.MERCHANT;
	}
	if (input.profileType === 'PLATFORM') {
		return profileTypeLabelMap.PLATFORM;
	}
	return profileTypeLabelMap.PARTNER;
}

export function buildCreateOrganizationRequest(
	input: CreateOrganizationFormBody
): CreateOrganizationRequest {
	const businessType = businessTypeLabelMap[input.orgBusinessType];
	const profileType = resolveCreateOrganizationProfileType(input);

	if (!businessType) {
		throw new Error('Invalid business type');
	}

	const serviceTypes =
		profileType === 'MERCHANT'
			? input.selectedServiceTypes.map((label) => {
					const serviceType = serviceTypeLabelMap[label];
					if (!serviceType) {
						throw new Error(`Invalid service type: ${label}`);
					}
					const pipelineCode = input.servicePipelines[label]?.trim();
					if (!pipelineCode) {
						throw new Error(`Bank pipeline is required for ${label}`);
					}
					return {
						serviceType,
						bankPipelineCodes: [pipelineCode]
					};
				})
			: [];

	const affiliateId = input.affiliateId.trim() ? input.affiliateId.trim() : null;

	return v.parse(CreateOrganizationRequestSchema, {
		legalCompanyName: input.orgName.trim(),
		businessType,
		phoneNumber: toE164IndianPhone(input.orgPhone),
		userEmail: input.orgEmail.trim(),
		profileType,
		affiliateId,
		serviceTypes
	});
}
