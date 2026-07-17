import * as v from 'valibot';
import { UpdateOrganizationKybRequestSchema, type UpdateOrganizationKybRequest } from './schema';
import { toE164IndianPhone } from './map-request';
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

export const UpdateOrganizationFormAddressSchema = addressSchema;

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

export const UpdateOrganizationFormBodySchema = v.object({
	businessType: v.string(),
	gstin: gstinSchema,
	businessPan: businessPanSchema,
	businessPhone: businessPhoneSchema,
	industry: industrySchema,
	organizationWebsite: organizationWebsiteSchema,
	registeredYear: registeredYearSchema,
	cin: optionalCinSchema,
	tan: optionalTanSchema,
	registeredAddress: UpdateOrganizationFormAddressSchema,
	communicationAddress: UpdateOrganizationFormAddressSchema,
	directors: v.optional(v.array(UpdateOrganizationDirectorFormSchema), [])
});

export type UpdateOrganizationFormBody = v.InferOutput<typeof UpdateOrganizationFormBodySchema>;

export function buildUpdateOrganizationKybRequest(
	input: UpdateOrganizationFormBody
): UpdateOrganizationKybRequest {
	const cinSchema =
		input.businessType === 'Private Limited' ? requiredCinSchema : optionalCinSchema;
	const cin = v.parse(cinSchema, input.cin);

	return v.parse(UpdateOrganizationKybRequestSchema, {
		addressDetails: {
			address: joinStreetAddress(input.registeredAddress.line1, input.registeredAddress.line2),
			city: input.registeredAddress.city,
			country: input.registeredAddress.country,
			pinCode: input.registeredAddress.pincode,
			state: input.registeredAddress.state
		},
		directors: (input.directors ?? []).map((director) => ({
			aadhar: normalizeAadhar(director.aadhar),
			email: director.email,
			name: director.name,
			pan: normalizePanInput(director.pan),
			phoneNumber: toE164IndianPhone(director.phone)
		})),
		kyb: {
			businessPan: input.businessPan,
			businessPhone: toE164IndianPhone(input.businessPhone),
			cin,
			communicationAddress: flattenCommunicationAddress(input.communicationAddress),
			gstNumber: input.gstin,
			industry: input.industry,
			organizationWebsite: input.organizationWebsite,
			registeredYear: input.registeredYear,
			tan: input.tan
		}
	});
}
