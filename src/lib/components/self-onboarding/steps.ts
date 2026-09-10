export const SELF_ONBOARDING_BASE = '/self-onboarding' as const;

export const STEPS = [
	{
		path: 'pan-number',
		navLabel: 'PAN Verification',
		tabLabel: 'Business PAN',
		eyebrow: '',
		title: 'Verify your business',
		description: 'We use your PAN to auto-fill company details in the next steps.'
	},
	{
		path: 'gst-details',
		navLabel: 'GST Details',
		tabLabel: 'GST',
		eyebrow: 'Confirm your tax identity.',
		title: 'GST Details',
		description: 'Enter the GSTIN linked to this PAN.'
	},
	{
		path: 'business-details',
		navLabel: 'Company Details',
		tabLabel: 'Company',
		eyebrow: 'Tell us about the business.',
		title: 'Company Details',
		description: 'Enter identity, address, and contact information.'
	},
	{
		path: 'bank-details',
		navLabel: 'Bank Details',
		tabLabel: 'Bank',
		eyebrow: 'Where should we settle funds?',
		title: 'Bank Details',
		description: 'Add the settlement account for this merchant.'
	},
	{
		path: 'directors',
		navLabel: 'Directors',
		tabLabel: 'Directors',
		eyebrow: 'Who runs this business?',
		title: 'Directors',
		description: 'Add at least one director before approval.'
	},
	{
		path: 'documents',
		navLabel: 'Documents',
		tabLabel: 'Documents',
		eyebrow: 'Upload required KYC.',
		title: 'Documents',
		description: 'Upload the required KYC documents.'
	},
	{
		path: 'review-submit',
		navLabel: 'Review & Submit',
		tabLabel: 'Review',
		eyebrow: 'Almost done.',
		title: 'Review & Submit',
		description: 'Check the details below, then submit for review.'
	}
] as const;

export type StepPath = (typeof STEPS)[number]['path'];
export type StepIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const STEP_BY_PATH: Record<StepPath, StepIndex> = {
	'pan-number': 1,
	'gst-details': 2,
	'business-details': 3,
	'bank-details': 4,
	directors: 5,
	documents: 6,
	'review-submit': 7
};

export function stepHref(path: StepPath): `${typeof SELF_ONBOARDING_BASE}/${StepPath}` {
	return `${SELF_ONBOARDING_BASE}/${path}`;
}

export function stepIndexFromPathname(pathname: string): StepIndex {
	const segment = pathname.split('/').at(-1);
	if (segment && segment in STEP_BY_PATH) {
		return STEP_BY_PATH[segment as StepPath];
	}
	return 1;
}

export function previousStepPath(index: StepIndex): StepPath | null {
	if (index <= 1) return null;
	return STEPS[index - 2].path;
}

export function nextStepPath(index: StepIndex): StepPath | null {
	if (index >= STEPS.length) return null;
	return STEPS.at(index)?.path ?? null;
}

export function flooredProgressPercent(actualPercent: number, currentStep: StepIndex): number {
	return Math.max(actualPercent, currentStep === 1 ? Math.round(100 / STEPS.length) : 0);
}

export function maxReachableStep(currentStep: StepIndex, completedSteps: number[]): StepIndex {
	const highestCompleted = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
	const reachable = Math.max(currentStep, highestCompleted + 1);
	return Math.min(Math.max(reachable, 1), STEPS.length) as StepIndex;
}
