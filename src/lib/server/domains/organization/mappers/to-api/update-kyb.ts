import * as v from 'valibot';
import {
	UpdateOrganizationKybRequestSchema,
	type UpdateOrganizationKybRequest
} from '../../schema';
import { toE164IndianPhone } from './create-organization';
import {
	aadharSchema,
	addressSchema,
	businessPanSchema,
	businessPhoneSchema,
	flattenCommunicationAddress,
	gstinSchema,
	industrySchema,
	joinStreetAddress,
	normalizeAadhar,
	normalizePanInput,
	optionalCinSchema,
	optionalTanSchema,
	organizationWebsiteSchema,
	registeredYearSchema,
	requiredCinSchema
} from '$lib/validation/organization-kyb';

export type KybUpdateSection = 'legal' | 'address' | 'directors';

export const UpdateOrganizationFormAddressSchema = addressSchema;

const passthroughAddressSchema = v.object({
	line1: v.string(),
	line2: v.string(),
	city: v.string(),
	state: v.string(),
	pincode: v.string(),
	country: v.string()
});

export const UpdateOrganizationDirectorFormSchema = v.object({
	name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Name is required')),
	pan: v.pipe(
		v.string(),
		v.trim(),
		v.transform(normalizePanInput),
		v.minLength(1, 'PAN is required')
	),
	email: v.pipe(v.string(), v.trim(), v.email('Enter a valid email address')),
	phone: businessPhoneSchema,
	aadhar: aadharSchema
});

const sharedLegalFields = {
	businessType: v.string(),
	gstin: gstinSchema,
	businessPan: businessPanSchema,
	businessPhone: businessPhoneSchema,
	industry: industrySchema,
	organizationWebsite: organizationWebsiteSchema,
	registeredYear: registeredYearSchema,
	cin: optionalCinSchema,
	tan: optionalTanSchema
};

export const UpdateOrganizationLegalSectionSchema = v.object({
	section: v.literal('legal'),
	...sharedLegalFields,
	registeredAddress: passthroughAddressSchema,
	communicationAddress: passthroughAddressSchema,
	directors: v.optional(v.array(UpdateOrganizationDirectorFormSchema), [])
});

export const UpdateOrganizationAddressSectionSchema = v.object({
	section: v.literal('address'),
	...sharedLegalFields,
	registeredAddress: UpdateOrganizationFormAddressSchema,
	communicationAddress: UpdateOrganizationFormAddressSchema,
	directors: v.optional(v.array(UpdateOrganizationDirectorFormSchema), [])
});

export const UpdateOrganizationDirectorsSectionSchema = v.object({
	section: v.literal('directors'),
	...sharedLegalFields,
	registeredAddress: UpdateOrganizationFormAddressSchema,
	communicationAddress: UpdateOrganizationFormAddressSchema,
	directors: v.pipe(
		v.array(UpdateOrganizationDirectorFormSchema),
		v.minLength(1, 'Add at least one director')
	)
});

export const UpdateOrganizationSectionFormBodySchema = v.union([
	UpdateOrganizationLegalSectionSchema,
	UpdateOrganizationAddressSectionSchema,
	UpdateOrganizationDirectorsSectionSchema
]);

/** @deprecated Use section schemas; kept for tests and full-form validation. */
export const UpdateOrganizationFormBodySchema = v.object({
	...sharedLegalFields,
	registeredAddress: UpdateOrganizationFormAddressSchema,
	communicationAddress: UpdateOrganizationFormAddressSchema,
	directors: v.optional(v.array(UpdateOrganizationDirectorFormSchema), [])
});

export type UpdateOrganizationFormBody = v.InferOutput<typeof UpdateOrganizationFormBodySchema>;
export type UpdateOrganizationSectionFormBody = v.InferOutput<
	typeof UpdateOrganizationSectionFormBodySchema
>;

type AddressInput = v.InferOutput<typeof passthroughAddressSchema>;

function isAddressFilled(address: AddressInput): boolean {
	return Boolean(
		address.line1.trim() &&
		address.line2.trim() &&
		address.city.trim() &&
		address.state.trim() &&
		address.pincode.trim() &&
		address.country.trim()
	);
}

function resolveCin(businessType: string, cin: string): string {
	const cinSchema = businessType === 'Private Limited' ? requiredCinSchema : optionalCinSchema;
	return v.parse(cinSchema, cin);
}

function mapDirectorsPayload(
	directors: UpdateOrganizationFormBody['directors'] | undefined
): UpdateOrganizationKybRequest['directors'] {
	return (directors ?? []).map((director) => ({
		aadhar: normalizeAadhar(director.aadhar),
		email: director.email,
		name: director.name,
		pan: normalizePanInput(director.pan),
		phoneNumber: toE164IndianPhone(director.phone)
	}));
}

function mapAddressDetailsForSection(
	address: AddressInput,
	section: KybUpdateSection
): UpdateOrganizationKybRequest['addressDetails'] {
	if (section === 'legal' && !isAddressFilled(address)) {
		return {
			address: '-',
			city: '-',
			country: 'India',
			pinCode: '-',
			state: '-'
		};
	}

	return {
		address: joinStreetAddress(address.line1, address.line2),
		city: address.city.trim(),
		country: address.country.trim() || 'India',
		pinCode: address.pincode.trim(),
		state: address.state.trim()
	};
}

function mapCommunicationAddressForSection(
	input: UpdateOrganizationFormBody,
	section: KybUpdateSection
): string {
	if (isAddressFilled(input.communicationAddress)) {
		return flattenCommunicationAddress(input.communicationAddress);
	}
	if (isAddressFilled(input.registeredAddress)) {
		return flattenCommunicationAddress(input.registeredAddress);
	}
	if (section === 'legal') {
		return '-';
	}
	throw new Error('Communication address is required');
}

function mapSectionToUpstream(
	input: UpdateOrganizationFormBody,
	section: KybUpdateSection
): UpdateOrganizationKybRequest {
	const payload: UpdateOrganizationKybRequest = {
		addressDetails: mapAddressDetailsForSection(input.registeredAddress, section),
		directors: section === 'legal' ? [] : mapDirectorsPayload(input.directors),
		kyb: {
			businessPan: input.businessPan,
			businessPhone: toE164IndianPhone(input.businessPhone),
			cin: resolveCin(input.businessType, input.cin),
			communicationAddress: mapCommunicationAddressForSection(input, section),
			gstNumber: input.gstin,
			industry: input.industry,
			organizationWebsite: input.organizationWebsite,
			registeredYear: input.registeredYear,
			tan: input.tan
		}
	};

	if (section === 'directors' || section === 'address') {
		return v.parse(UpdateOrganizationKybRequestSchema, payload);
	}

	return payload;
}

export function buildUpdateOrganizationSectionRequest(
	input: UpdateOrganizationSectionFormBody
): UpdateOrganizationKybRequest {
	return mapSectionToUpstream(input, input.section);
}

export function buildUpdateOrganizationKybRequest(
	input: UpdateOrganizationFormBody
): UpdateOrganizationKybRequest {
	return mapSectionToUpstream(input, 'directors');
}
