import type { StepId } from '$lib/components/self-onboarding/steps';

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
		patterns: [/\bemail\b/i, /\baddress\b/i, /\bpincode\b/i, /\blegal name\b/i, /\bcompany name\b/i]
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
 * The identity-step fields a routed error can be pinned under, keyed like `verifications` (each
 * is a FieldRow with that `remarkKey`). Business phone is left out — it isn't a FieldRow.
 */
const IDENTITY_FIELD_PATTERNS: readonly { key: string; pattern: RegExp }[] = [
	{ key: 'kyb.gstNumber', pattern: /\bgst(in)?\b/i },
	{ key: 'kyb.businessPan', pattern: /\bpan\b/i },
	{ key: 'kyb.cin', pattern: /\bcin\b/i },
	{ key: 'kyb.tan', pattern: /\btan\b/i },
	{ key: 'kyb.industry', pattern: /\bindustry\b/i },
	{ key: 'kyb.registeredYear', pattern: /\bregistered year\b/i },
	{ key: 'kyb.organizationWebsite', pattern: /\bwebsite\b/i },
	{ key: 'brandName', pattern: /\bbrand/i }
];

/**
 * The single field a save/submit error concerns, or null when it names none or several (e.g.
 * "GST number or TAN is already registered") — those stay a step-level message.
 */
export function routeSaveErrorToField(message: string): string | null {
	if (routeSaveErrorToStep(message) !== 1) return null;
	const keys = IDENTITY_FIELD_PATTERNS.filter(({ pattern }) => pattern.test(message));
	return keys.length === 1 ? keys[0].key : null;
}
