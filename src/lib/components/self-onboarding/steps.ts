export const SELF_ONBOARDING_BASE = '/self-onboarding' as const;

export const STEPS = [
	{
		path: 'business-identity',
		label: 'Tax and registration',
		title: 'Tax and registration'
	},
	{
		path: 'business-profile',
		label: 'Address',
		title: 'Address'
	},
	{
		path: 'bank-details',
		label: 'Bank',
		title: 'Bank details'
	},
	{
		path: 'directors',
		label: 'Directors',
		title: 'Directors'
	},
	{
		path: 'documents',
		label: 'Documents',
		title: 'Documents'
	},
	{
		path: 'review-submit',
		label: 'Review',
		title: 'Review & submit'
	}
] as const;

export type StepPath = (typeof STEPS)[number]['path'];
export type StepId = 1 | 2 | 3 | 4 | 5 | 6;

export const STEP_BY_PATH: Record<StepPath, StepId> = {
	'business-identity': 1,
	'business-profile': 2,
	'bank-details': 3,
	directors: 4,
	documents: 5,
	'review-submit': 6
};

export function stepHref(path: StepPath): `${typeof SELF_ONBOARDING_BASE}/${StepPath}` {
	return `${SELF_ONBOARDING_BASE}/${path}`;
}

export function stepIdFromPathname(pathname: string): StepId {
	const segment = pathname.split('/').at(-1);
	if (segment && segment in STEP_BY_PATH) {
		return STEP_BY_PATH[segment as StepPath];
	}
	return 1;
}

export function previousStepPath(id: StepId): StepPath | null {
	if (id <= 1) return null;
	return STEPS[id - 2].path;
}

export function nextStepPath(id: StepId): StepPath | null {
	if (id >= STEPS.length) return null;
	return STEPS.at(id)?.path ?? null;
}

/** First step that has not been completed yet; the last step once all are done. */
export function firstIncompleteStep(completedSteps: readonly number[]): StepId {
	for (let id = 1; id <= STEPS.length; id += 1) {
		if (!completedSteps.includes(id)) return id as StepId;
	}
	return STEPS.length as StepId;
}

/** Overall progress, never showing 0% while the first step is in progress. */
export function flooredProgressPercent(actualPercent: number, currentStep: StepId): number {
	return Math.max(actualPercent, currentStep === 1 ? Math.round(100 / STEPS.length) : 0);
}

export type OnboardingStatus = 'in_progress' | 'remarked' | 'read_only';

/**
 * REMARKED is sent back for corrections: only rejected fields stay editable.
 * IN_REVIEW and anything later (APPROVED, ACTIVE, …) is fully read-only.
 */
const REMARKED_STATUS = 'REMARKED';
const IN_PROGRESS_STATUSES = new Set(['', 'DRAFT', 'IN_PROGRESS']);

/** Interprets a raw `profileStatus` string off GET /organization — see extractProfileStatus. */
export function resolveOnboardingStatus(profileStatus: string): OnboardingStatus {
	// Same normalization as management's mapStatus (get-organization.ts): "In Progress" and
	// "IN_PROGRESS" are one status — without it a spaced value falls through to read-only.
	const normalized = profileStatus
		.trim()
		.toUpperCase()
		.replace(/[\s-]+/g, '_');
	if (normalized === REMARKED_STATUS) return 'remarked';
	if (IN_PROGRESS_STATUSES.has(normalized)) return 'in_progress';
	return 'read_only';
}
