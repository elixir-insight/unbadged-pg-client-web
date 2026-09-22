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
			/\bregistered year\b/i
		]
	},
	{
		step: 2,
		patterns: [
			/\bbrand\b/i,
			/\bwebsite\b/i,
			/\bphone\b/i,
			/\bemail\b/i,
			/\baddress\b/i,
			/\bpincode\b/i,
			/\blegal name\b/i,
			/\bcompany name\b/i
		]
	}
];

/** Returns the step a save/submit error message concerns, or null when nothing matches. */
export function routeSaveErrorToStep(message: string): StepId | null {
	for (const { step, patterns } of STEP_ERROR_PATTERNS) {
		if (patterns.some((pattern) => pattern.test(message))) return step;
	}
	return null;
}
