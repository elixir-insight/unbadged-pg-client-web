import * as v from 'valibot';

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AADHAR_PATTERN = /^[2-9]\d{11}$/;
const CIN_PATTERN = /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
const TAN_PATTERN = /^[A-Z]{4}\d{5}[A-Z]$/;
const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;
const PLACE_NAME_PATTERN = /^[A-Za-z .'-]+$/;
const INDUSTRY_PATTERN = /^[A-Za-z0-9 .,&/-]+$/;
const WEBSITE_PATTERN =
	/^(https?:\/\/)?([A-Za-z0-9-]+\.)+[A-Za-z]{2,}(\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=-]*)?$/i;

const currentYear = new Date().getFullYear();

function normalizeId(value: string): string {
	return value.trim().toUpperCase();
}

export const requiredTextSchema = (label: string) =>
	v.pipe(v.string(), v.trim(), v.minLength(1, `${label} is required`));

export const gstinSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'GSTIN is required'),
	v.transform(normalizeId),
	v.check((val) => GSTIN_PATTERN.test(val), 'Enter a valid 15-character GSTIN')
);

export const businessPanSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'Business PAN is required'),
	v.transform(normalizeId),
	v.check((val) => PAN_PATTERN.test(val), 'Enter a valid PAN (e.g. ABCDE1234F)')
);

export const directorPanSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'PAN is required'),
	v.transform(normalizePanInput),
	v.check((val) => PAN_PATTERN.test(val), 'Enter a valid PAN (e.g. ABCDE1234F)')
);

export function normalizePanInput(value: string): string {
	return value
		.replace(/[^a-zA-Z0-9]/g, '')
		.toUpperCase()
		.slice(0, 10);
}

export function normalizeAadhar(value: string): string {
	return value.replace(/\D/g, '').slice(0, 12);
}

/** Strips +91 / leading 0 so validation accepts common Indian phone formats. */
export function normalizeIndianMobilePhone(value: string): string {
	const digits = value.replace(/\D/g, '');
	if (digits.length === 12 && digits.startsWith('91')) {
		return digits.slice(2);
	}
	if (digits.length === 11 && digits.startsWith('0')) {
		return digits.slice(1);
	}
	return digits;
}

/** Formats Aadhar as `XXXX XXXX XXXX` while typing. */
export function formatAadharInput(value: string): string {
	const digits = normalizeAadhar(value);
	return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export const aadharSchema = v.pipe(
	v.string(),
	v.trim(),
	v.transform(normalizeAadhar),
	v.minLength(12, 'Aadhar is required'),
	v.maxLength(12, 'Enter a valid 12-digit Aadhar number'),
	v.check((val) => AADHAR_PATTERN.test(val), 'Enter a valid 12-digit Aadhar number')
);

export const businessPhoneSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'Business phone is required'),
	v.transform(normalizeIndianMobilePhone),
	v.check((val) => /^[6-9]\d{9}$/.test(val), 'Enter a valid 10-digit Indian mobile number')
);

export const industrySchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'Industry is required'),
	v.check((val) => INDUSTRY_PATTERN.test(val), 'Enter a valid industry')
);

export const organizationWebsiteSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'Organization website is required'),
	v.check((val) => WEBSITE_PATTERN.test(val), 'Enter a valid website URL')
);

export const registeredYearSchema = v.pipe(
	v.union([v.number(), v.string(), v.null_(), v.literal('')]),
	v.transform((val) => {
		if (val === null || val === '') return NaN;
		return typeof val === 'number' ? val : Number(val);
	}),
	v.check(
		(val) => Number.isInteger(val) && val >= 1800 && val <= currentYear,
		`Enter a valid year between 1800 and ${currentYear}`
	)
);

export const optionalCinSchema = v.pipe(
	v.string(),
	v.trim(),
	v.transform(normalizeId),
	v.check((val) => val === '' || CIN_PATTERN.test(val), 'Enter a valid CIN')
);

export const requiredCinSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'CIN is required for Private Limited companies'),
	v.transform(normalizeId),
	v.check((val) => CIN_PATTERN.test(val), 'Enter a valid CIN')
);

export const optionalTanSchema = v.pipe(
	v.string(),
	v.trim(),
	v.transform(normalizeId),
	v.check((val) => val === '' || TAN_PATTERN.test(val), 'Enter a valid TAN')
);

export const placeNameSchema = (label: string) =>
	v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, `${label} is required`),
		v.check((val) => PLACE_NAME_PATTERN.test(val), `Enter a valid ${label.toLowerCase()}`)
	);

export const pincodeSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'Pincode is required'),
	v.check((val) => PINCODE_PATTERN.test(val), 'Enter a valid 6-digit Indian pincode')
);

export const addressSchema = v.object({
	line1: requiredTextSchema('Address line 1'),
	line2: requiredTextSchema('Address line 2'),
	city: placeNameSchema('City'),
	state: placeNameSchema('State'),
	pincode: pincodeSchema,
	country: placeNameSchema('Country')
});

const legalBaseSchema = v.object({
	gstin: gstinSchema,
	businessPan: businessPanSchema,
	businessPhone: businessPhoneSchema,
	industry: industrySchema,
	organizationWebsite: organizationWebsiteSchema,
	registeredYear: registeredYearSchema,
	cin: optionalCinSchema,
	tan: optionalTanSchema
});

export interface LegalStepInput {
	gstin: string;
	businessPan: string;
	businessPhone: string;
	industry: string;
	organizationWebsite: string;
	registeredYear: number | null | '';
	cin: string;
	tan: string;
	businessType: string;
}

export interface AddressStepInput {
	registeredAddress: {
		line1: string;
		line2: string;
		city: string;
		state: string;
		pincode: string;
		country: string;
	};
	communicationAddress: {
		line1: string;
		line2: string;
		city: string;
		state: string;
		pincode: string;
		country: string;
	};
}

type AddressFields = AddressStepInput['registeredAddress'];

function registeredYearEqual(a: number | null | '', b: number | null | ''): boolean {
	const normalize = (value: number | null | '') => (value === '' || value === null ? null : value);
	return normalize(a) === normalize(b);
}

function addressFieldsEqual(a: AddressFields, b: AddressFields): boolean {
	return (
		a.line1.trim() === b.line1.trim() &&
		a.line2.trim() === b.line2.trim() &&
		a.city.trim() === b.city.trim() &&
		a.state.trim() === b.state.trim() &&
		a.pincode.trim() === b.pincode.trim() &&
		(a.country ?? '').trim() === (b.country ?? '').trim()
	);
}

/** Normalized comparison for legal KYB step — ignores phone/PAN formatting differences from GET. */
export function legalStepFieldsEqual(a: LegalStepInput, b: LegalStepInput): boolean {
	return (
		a.gstin.trim().toUpperCase() === b.gstin.trim().toUpperCase() &&
		normalizePanInput(a.businessPan) === normalizePanInput(b.businessPan) &&
		normalizeIndianMobilePhone(a.businessPhone) === normalizeIndianMobilePhone(b.businessPhone) &&
		a.industry.trim() === b.industry.trim() &&
		a.organizationWebsite.trim() === b.organizationWebsite.trim() &&
		registeredYearEqual(a.registeredYear, b.registeredYear) &&
		a.cin.trim().toUpperCase() === b.cin.trim().toUpperCase() &&
		a.tan.trim().toUpperCase() === b.tan.trim().toUpperCase() &&
		a.businessType === b.businessType
	);
}

/** Normalized comparison for address KYB step. */
export function addressStepFieldsEqual(
	a: AddressStepInput,
	b: AddressStepInput,
	aSameAsRegistered: boolean,
	bSameAsRegistered: boolean
): boolean {
	if (aSameAsRegistered !== bSameAsRegistered) return false;
	if (!addressFieldsEqual(a.registeredAddress, b.registeredAddress)) return false;
	if (aSameAsRegistered) return true;
	return addressFieldsEqual(a.communicationAddress, b.communicationAddress);
}

function serializeDirectorsForComparison(
	directors: Array<{
		name: string;
		pan: string;
		email: string;
		phone: string;
		aadhar: string;
	}>
): string {
	return JSON.stringify(
		directors.map((director) => ({
			name: director.name.trim(),
			pan: normalizePanInput(director.pan),
			email: director.email.trim(),
			phone: normalizeIndianMobilePhone(director.phone),
			aadhar: normalizeAadhar(director.aadhar)
		}))
	);
}

/** Normalized comparison for directors KYB step. */
export function directorsStepFieldsEqual(
	a: Array<{ name: string; pan: string; email: string; phone: string; aadhar: string }>,
	b: Array<{ name: string; pan: string; email: string; phone: string; aadhar: string }>
): boolean {
	return serializeDirectorsForComparison(a) === serializeDirectorsForComparison(b);
}

function collectIssues(issues: v.BaseIssue<unknown>[]): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const issue of issues) {
		const path = issue.path?.map((part) => String(part.key)).join('.') ?? '';
		if (path && !errors[path]) {
			errors[path] = issue.message;
		}
	}
	return errors;
}

export function validateLegalStep(input: LegalStepInput): Record<string, string> {
	const schema =
		input.businessType === 'Private Limited'
			? v.object({ ...legalBaseSchema.entries, cin: requiredCinSchema })
			: legalBaseSchema;

	const result = v.safeParse(schema, {
		gstin: input.gstin,
		businessPan: input.businessPan,
		businessPhone: input.businessPhone,
		industry: input.industry,
		organizationWebsite: input.organizationWebsite,
		registeredYear: input.registeredYear,
		cin: input.cin,
		tan: input.tan
	});

	return result.success ? {} : collectIssues(result.issues);
}

export function validateAddressStep(input: AddressStepInput): Record<string, string> {
	const schema = v.object({
		registeredAddress: addressSchema,
		communicationAddress: addressSchema
	});
	const result = v.safeParse(schema, input);
	return result.success ? {} : collectIssues(result.issues);
}

export interface DirectorStepInput {
	name: string;
	pan: string;
	email: string;
	phone: string;
	aadhar: string;
}

const directorFieldSchema = v.object({
	name: requiredTextSchema('Name'),
	pan: directorPanSchema,
	email: v.pipe(v.string(), v.trim(), v.email('Enter a valid email address')),
	phone: businessPhoneSchema,
	aadhar: aadharSchema
});

export function validateDirectorsStep(directors: DirectorStepInput[]): Record<string, string> {
	if (directors.length === 0) {
		return { directors: 'Add at least one director' };
	}

	const errors: Record<string, string> = {};
	directors.forEach((director, index) => {
		const result = v.safeParse(directorFieldSchema, director);
		if (!result.success) {
			for (const issue of result.issues) {
				const field = issue.path?.[0];
				const key = `directors.${index}.${String(field ?? 'root')}`;
				if (!errors[key]) {
					errors[key] = issue.message;
				}
			}
		}
	});
	return errors;
}

export function firstValidationError(errors: Record<string, string>): string | null {
	const values = Object.values(errors);
	return values.length === 0 ? null : values[0];
}

/** Street lines only for upstream addressDetails.address */
export function joinStreetAddress(line1: string, line2: string): string {
	return [line1, line2]
		.map((part) => part.trim())
		.filter(Boolean)
		.join(', ');
}

/** Full readable string for upstream kyb.communicationAddress */
export function flattenCommunicationAddress(
	address: AddressStepInput['communicationAddress']
): string {
	return [
		address.line1,
		address.line2,
		address.city,
		address.state,
		address.pincode,
		address.country
	]
		.map((part) => part.trim())
		.filter(Boolean)
		.join(', ');
}
