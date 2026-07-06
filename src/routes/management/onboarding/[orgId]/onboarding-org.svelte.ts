import { getContext, setContext } from 'svelte';
import type { Director } from '$lib/components/onboarding/kyb-details.svelte';
import type { OnboardingStepKey } from './steps';

const ONBOARDING_ORG_CTX = Symbol('onboarding-org');

type StepFlags = Record<OnboardingStepKey, boolean>;

export class OnboardingOrgState {
	directors = $state<Director[]>([{ id: 1, name: '', aadhaar: '', pan: '', email: '', phone: '' }]);
	nextDirectorId = $state(2);
	directorDocFiles = $state<Record<number, { aadhaar: File | null; pan: File | null }>>({
		1: { aadhaar: null, pan: null }
	});

	stepValid = $state<StepFlags>({
		kyb: false,
		account: false,
		documents: false,
		integration: false
	});

	stepsCompleted = $state<StepFlags>({
		kyb: false,
		account: false,
		documents: false,
		integration: false
	});

	localStatus = $state<string | null>(null);
	baseProfileStatus = $state('IN_PROGRESS');

	showApproveModal = $state(false);

	readonly allStepsCompleted = $derived(Object.values(this.stepsCompleted).every(Boolean));
	readonly allStepsValid = $derived(Object.values(this.stepValid).every(Boolean));

	readonly isApproved = $derived(
		(this.localStatus ?? this.baseProfileStatus).toUpperCase().replace(/\s+/g, '_') === 'APPROVED'
	);

	readonly canApprove = $derived(!this.isApproved && this.allStepsCompleted && this.allStepsValid);

	readonly showApproveAction = $derived(this.stepsCompleted.integration && this.canApprove);

	markStepComplete(step: OnboardingStepKey) {
		this.stepsCompleted[step] = true;
	}

	reset() {
		this.showApproveModal = false;
		this.localStatus = null;
		this.stepsCompleted = {
			kyb: false,
			account: false,
			documents: false,
			integration: false
		};
		this.stepValid = {
			kyb: false,
			account: false,
			documents: false,
			integration: false
		};
	}
}

export function setOnboardingOrgContext(state: OnboardingOrgState) {
	setContext(ONBOARDING_ORG_CTX, state);
}

export function getOnboardingOrgContext(): OnboardingOrgState {
	return getContext<OnboardingOrgState>(ONBOARDING_ORG_CTX);
}
