import * as v from 'valibot';

// ── Shared patterns ─────────────────────────────────────────────────
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
export const GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;
export const CIN_REGEX = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/i;
export const TAN_REGEX = /^[A-Z]{4}\d{5}[A-Z]$/i;
export const PIN_CODE_REGEX = /^\d{6}$/;
export const AADHAAR_REGEX = /^\d{12}$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
export const WEBSITE_REGEX = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}([/?#].*)?$/i;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
export const ACCOUNT_NUMBER_REGEX = /^\d{9,18}$/;

// ── Shared field builders ────────────────────────────────────────────
export function requiredText(message: string) {
	return v.pipe(v.string(), v.trim(), v.minLength(1, message));
}

export function requiredPattern(regex: RegExp, requiredMessage: string, formatMessage: string) {
	return v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, requiredMessage),
		v.check((val) => regex.test(val), formatMessage)
	);
}

export function optionalPattern(regex: RegExp, formatMessage: string) {
	return v.pipe(
		v.string(),
		v.transform((val) => val.trim()),
		v.check((val) => val === '' || regex.test(val), formatMessage)
	);
}

export const requiredFile = (message: string) =>
	v.pipe(
		v.nullable(v.instance(File)),
		v.check((val) => val !== null, message)
	);

// ── Flatten valibot issues into dot-path keyed errors, e.g. "directors.0.name" ──
export function flattenIssues(
	issues: readonly { path?: readonly { key: unknown }[]; message: string }[]
): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const issue of issues) {
		const key = issue.path?.map((p) => String(p.key)).join('.') ?? '';
		if (key && !errors[key]) errors[key] = issue.message;
	}
	return errors;
}

// ── KYB details ───────────────────────────────────────────────────────
export const directorSchema = v.object({
	name: requiredText('Director name is required'),
	aadhaar: requiredPattern(
		AADHAAR_REGEX,
		'Aadhaar number is required',
		'Enter a valid 12-digit Aadhaar number'
	),
	pan: requiredPattern(PAN_REGEX, 'PAN is required', 'Enter a valid PAN (e.g. ABCDE1234F)'),
	email: requiredPattern(EMAIL_REGEX, 'Email is required', 'Enter a valid email address'),
	phone: requiredPattern(
		PHONE_REGEX,
		'Phone number is required',
		'Enter a valid 10-digit phone number'
	)
});

export function buildKybSchema(isPrivateLimited: boolean) {
	return v.object({
		address: requiredText('Address is required'),
		stateVal: requiredText('State is required'),
		city: requiredText('City is required'),
		pinCode: requiredPattern(
			PIN_CODE_REGEX,
			'PIN code is required',
			'Enter a valid 6-digit PIN code'
		),
		businessPan: requiredPattern(
			PAN_REGEX,
			'Business PAN is required',
			'Enter a valid PAN (e.g. ABCDE1234F)'
		),
		companyGst: requiredPattern(
			GST_REGEX,
			'Company GST number is required',
			'Enter a valid 15-character GST number'
		),
		cinNumber: isPrivateLimited
			? requiredPattern(CIN_REGEX, 'CIN number is required', 'Enter a valid CIN number')
			: optionalPattern(CIN_REGEX, 'Enter a valid CIN number'),
		tanNumber: isPrivateLimited
			? requiredPattern(TAN_REGEX, 'TAN number is required', 'Enter a valid TAN number')
			: optionalPattern(TAN_REGEX, 'Enter a valid TAN number'),
		communicationAddress: requiredText('Communication address is required'),
		companyPhone: requiredPattern(
			PHONE_REGEX,
			'Company phone is required',
			'Enter a valid 10-digit phone number'
		),
		companyWebsite: requiredPattern(
			WEBSITE_REGEX,
			'Website URL is required',
			'Enter a valid website URL'
		),
		registeredYear: v.pipe(
			v.string(),
			v.transform((val) => val.trim()),
			v.minLength(1, 'Registered year is required'),
			v.check((val) => /^\d{4}$/.test(val), 'Enter a valid 4-digit year'),
			v.check((val) => {
				const year = Number(val);
				return year >= 1800 && year <= new Date().getFullYear();
			}, 'Enter a valid registration year')
		),
		industry: v.pipe(
			requiredText('Industry is required'),
			v.maxLength(100, 'Industry must be under 100 characters')
		),
		directors: v.pipe(v.array(directorSchema), v.minLength(1, 'At least one director is required'))
	});
}

// ── Bank details ────────────────────────────────────────────────────
export const bankAccountSchema = v.pipe(
	v.object({
		accountHolderName: requiredText('Account holder name is required'),
		accountNumber: requiredPattern(
			ACCOUNT_NUMBER_REGEX,
			'Account number is required',
			'Enter a valid account number (9-18 digits)'
		),
		confirmAccountNumber: requiredText('Please confirm the account number'),
		bank: requiredText('Bank name is required'),
		branch: v.pipe(v.string(), v.trim()),
		ifscNumber: requiredPattern(
			IFSC_REGEX,
			'IFSC code is required',
			'Enter a valid IFSC code (e.g. HDFC0001234)'
		)
	}),
	v.forward(
		v.partialCheck(
			[['accountNumber'], ['confirmAccountNumber']],
			(input) => input.accountNumber === input.confirmAccountNumber,
			'Account numbers do not match'
		),
		['confirmAccountNumber']
	)
);

// ── Documents ───────────────────────────────────────────────────────
export function buildDocumentsSchema(isPrivateLimited: boolean) {
	const shape: Record<string, ReturnType<typeof requiredFile>> = {
		bizCert: requiredFile('Business certificate is required'),
		proofOfFunds: requiredFile('Proof of funds is required'),
		rentalAgreement: requiredFile('Rental agreement is required'),
		gstCert: requiredFile('GST certificate is required'),
		proprietorPhoto: requiredFile('Proprietor photo is required')
	};
	if (isPrivateLimited) {
		shape.bizPan = requiredFile('Business PAN card is required');
		shape.bizTan = requiredFile('Business TAN is required');
		shape.aoaCert = requiredFile('AOA certificate is required');
		shape.moaCert = requiredFile('MOA certificate is required');
	}
	return v.object(shape);
}

// ── Integration ─────────────────────────────────────────────────────
export const integrationSchema = v.object({
	callbackUrl: requiredPattern(
		WEBSITE_REGEX,
		'Callback URL is required',
		'Enter a valid callback URL'
	),
	ipAddress: optionalPattern(IPV4_REGEX, 'Enter a valid IPv4 address')
});
