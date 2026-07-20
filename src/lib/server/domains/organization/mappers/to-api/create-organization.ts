import * as v from 'valibot';
import { CreateOrganizationRequestSchema, type CreateOrganizationRequest } from '../../schema';

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

const profileTypeLabelMap: Record<string, CreateOrganizationRequest['profileType']> = {
	Merchant: 'MERCHANT',
	Partner: 'PARTNER'
};

export const CreateOrganizationFormBodySchema = v.object({
	selectedCategory: v.picklist(['Merchant', 'Partner']),
	orgName: v.pipe(v.string(), v.trim(), v.minLength(1, 'Organization name is required')),
	orgPhone: v.pipe(v.string(), v.trim(), v.minLength(1, 'Mobile number is required')),
	orgEmail: v.pipe(v.string(), v.trim(), v.email('Enter a valid email address')),
	orgBusinessType: v.pipe(v.string(), v.minLength(1, 'Business type is required')),
	affiliateId: v.optional(v.string(), ''),
	selectedServiceTypes: v.optional(v.array(v.string()), []),
	servicePipelines: v.optional(v.record(v.string(), v.string()), {})
});

export type CreateOrganizationFormBody = v.InferOutput<typeof CreateOrganizationFormBodySchema>;

export function toE164IndianPhone(phone: string): string {
	const digits = phone.replace(/\D/g, '');
	if (digits.length === 10) return `+91${digits}`;
	if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
	return phone.startsWith('+') ? phone : `+${digits}`;
}

export function buildCreateOrganizationRequest(
	input: CreateOrganizationFormBody
): CreateOrganizationRequest {
	const businessType = businessTypeLabelMap[input.orgBusinessType];
	const profileType = profileTypeLabelMap[input.selectedCategory];

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
