import type { StepId } from '$lib/components/self-onboarding/steps';
import type { Director } from '$lib/types/onboarding';
import { routeToStep } from './remarkRouting';

/**
 * Backend save/submit failures are a plain message, not a structured field key like the
 * `verifications` remarks are, so routing them to the right step is a best-effort keyword
 * match against that step's fields. Checked most-specific step first: a director error always
 * names "director", and bank errors are distinctive enough not to collide with identity's bare
 * "account"-free vocabulary — identity is checked before profile since GST/PAN/CIN/TAN read
 * unambiguously, leaving profile as the catch-all for contact/address wording.
 */
const STEP_ERROR_PATTERNS: readonly { step: StepId; patterns: readonly RegExp[] }[] = [
	{ step: 4, patterns: [/\bdirector/i, /\baadhaar?\b/i] },
	// Ahead of identity: "documents are incomplete: business TAN, …" is about the uploads, not the
	// TAN field.
	{
		step: 5,
		patterns: [/\bdocuments?\b/i, /\barticles? of association\b/i, /\bmemorandum\b/i]
	},
	{ step: 3, patterns: [/\bbank\b/i, /\bifsc\b/i, /\baccount\b/i, /\bbranch\b/i] },
	{
		step: 1,
		patterns: [
			/\bgst(in)?\b/i,
			/\btan\b/i,
			/\bcin\b/i,
			/\bpan\b/i,
			/\bindustry\b/i,
			/\bregistered year\b/i,
			// Also matches the backend's camelCase `brandName`.
			/\bbrand/i,
			/\bwebsite\b/i,
			/\bphone\b/i
		]
	},
	{
		step: 2,
		patterns: [
			/\bemail\b/i,
			/\baddress\b/i,
			/\bpin\s?code\b/i,
			/\bcity\b/i,
			/\bstate\b/i,
			/\blegal name\b/i,
			/\bcompany name\b/i
		]
	}
];

/**
 * Words naming a field a step's own form also has, beyond its STEP_ERROR_PATTERNS — directors
 * carry a PAN, email and phone too, so "Invalid PAN" from the directors save is about a
 * director's PAN, not the business PAN on step 1. (Not "name": "company name" is step 2's.)
 */
const SHARED_FIELD_PATTERNS: Partial<Record<StepId, readonly RegExp[]>> = {
	4: [/\bpan\b/i, /\be-?mail\b/i, /\bphone\b/i, /\bmobile\b/i]
};

function stepOwnsMessage(step: StepId, message: string): boolean {
	const patterns = [
		...(STEP_ERROR_PATTERNS.find((entry) => entry.step === step)?.patterns ?? []),
		...(SHARED_FIELD_PATTERNS[step] ?? [])
	];
	return patterns.some((pattern) => pattern.test(message));
}

/**
 * Returns the step a save/submit error message concerns, or null when nothing matches. When the
 * step the save came from has a field the message names, the error stays there — it's about the
 * data that step just sent, not a same-named field elsewhere.
 */
export function routeSaveErrorToStep(message: string, currentStep?: StepId): StepId | null {
	if (currentStep !== undefined && stepOwnsMessage(currentStep, message)) return currentStep;
	for (const { step, patterns } of STEP_ERROR_PATTERNS) {
		if (patterns.some((pattern) => pattern.test(message))) return step;
	}
	return null;
}

/**
 * Identity-step fields a message can name, keyed like `verifications` (each input carries that
 * key as its `remarkKey` / `fieldKey`). Every match is kept: "GST number or TAN is already
 * registered…" marks both fields.
 */
const IDENTITY_FIELD_PATTERNS: readonly { key: string; pattern: RegExp }[] = [
	{ key: 'kyb.businessPan', pattern: /\bpan\b/i },
	{ key: 'brandName', pattern: /\bbrand/i },
	{ key: 'kyb.gstNumber', pattern: /\bgst(in)?\b/i },
	{ key: 'kyb.cin', pattern: /\bcin\b/i },
	{ key: 'kyb.tan', pattern: /\btan\b/i },
	{ key: 'kyb.industry', pattern: /\bindustry\b/i },
	{ key: 'kyb.registeredYear', pattern: /\bregistered year\b/i },
	{ key: 'kyb.businessPhone', pattern: /\b(phone|mobile)\b/i },
	{ key: 'kyb.organizationWebsite', pattern: /\bwebsite\b/i }
];

type AddressField = 'address' | 'city' | 'state' | 'pinCode';

const ADDRESS_FIELDS: readonly AddressField[] = ['address', 'city', 'state', 'pinCode'];

const ADDRESS_FIELD_PATTERNS: readonly { field: AddressField; pattern: RegExp }[] = [
	{ field: 'city', pattern: /\bcity\b/i },
	{ field: 'state', pattern: /\bstate\b/i },
	{ field: 'pinCode', pattern: /\bpin\s?code\b|\bpin\b|\bpostal\b/i }
];

/** The communication address inputs' keys — the backend knows it as one string. */
export function communicationAddressKey(field: AddressField): string {
	return field === 'address' ? 'kyb.communicationAddress' : `kyb.communicationAddress.${field}`;
}

export function registeredAddressKey(field: AddressField): string {
	return `addressDetails.${field}`;
}

const DIRECTOR_FIELD_PATTERNS: readonly { field: string; pattern: RegExp }[] = [
	{ field: 'pan', pattern: /\bpan\b/i },
	{ field: 'aadhar', pattern: /\baadhaa?r\b/i },
	{ field: 'email', pattern: /\be-?mail\b/i },
	{ field: 'name', pattern: /\bname\b/i }
];

export interface SaveErrorContext {
	/** The step whose save failed. */
	currentStep?: StepId;
	/** A field key the backend named, when it names one. */
	field?: string;
	/** "Same as communication address" — registered-address errors then show on the communication inputs. */
	sameAsCommunication?: boolean;
	/** For telling which director a message is about, by the values it quotes. */
	directors?: readonly Pick<Director, 'name' | 'email' | 'pan' | 'phone'>[];
}

export interface SaveErrorTarget {
	/** The step the error belongs on; null when nothing places it. */
	step: StepId | null;
	/** Input keys to mark (see FieldRow `remarkKey`), in form order; empty for a step-level error. */
	fields: string[];
}

function addressKeyFromField(field: string, sameAsCommunication: boolean): string {
	if (field === 'addressDetails' || field.startsWith('addressDetails.')) {
		if (!sameAsCommunication) return field === 'addressDetails' ? 'addressDetails.address' : field;
		const part = field.slice('addressDetails.'.length) as AddressField;
		return communicationAddressKey(ADDRESS_FIELDS.includes(part) ? part : 'address');
	}
	return field;
}

function addressFields(message: string, sameAsCommunication: boolean): string[] {
	const named = ADDRESS_FIELD_PATTERNS.filter(({ pattern }) => pattern.test(message)).map(
		({ field }) => field
	);
	const fields: AddressField[] =
		named.length > 0 ? named : /\baddress\b/i.test(message) ? ['address'] : [];
	const communication = sameAsCommunication || /\bcommunication\b/i.test(message);
	return fields.map((field) =>
		communication ? communicationAddressKey(field) : registeredAddressKey(field)
	);
}

function directorFields(message: string, directors: SaveErrorContext['directors'] = []): string[] {
	const text = message.toLowerCase();
	const quotes = (value: string) =>
		value.trim().length > 2 && text.includes(value.trim().toLowerCase());
	const index =
		directors.length === 1
			? 0
			: directors.findIndex(
					(d) => quotes(d.email) || quotes(d.pan) || quotes(d.phone) || quotes(d.name)
				);
	if (index === -1) return [];
	return DIRECTOR_FIELD_PATTERNS.filter(({ pattern }) => pattern.test(message)).map(
		({ field }) => `directors[${index}].${field}`
	);
}

/**
 * Where a save/submit error belongs: the step, and the inputs to mark on it. A field key from the
 * backend wins; otherwise the message text is matched against each step's field vocabulary.
 */
export function mapSaveError(message: string, context: SaveErrorContext = {}): SaveErrorTarget {
	const sameAsCommunication = context.sameAsCommunication ?? false;
	if (context.field) {
		return {
			step: routeToStep(context.field),
			fields: [addressKeyFromField(context.field, sameAsCommunication)]
		};
	}
	const step = routeSaveErrorToStep(message, context.currentStep);
	switch (step) {
		case 1:
			return {
				step,
				fields: IDENTITY_FIELD_PATTERNS.filter(({ pattern }) => pattern.test(message)).map(
					({ key }) => key
				)
			};
		case 2:
			return { step, fields: addressFields(message, sameAsCommunication) };
		case 4:
			return { step, fields: directorFields(message, context.directors) };
		default:
			return { step, fields: [] };
	}
}
