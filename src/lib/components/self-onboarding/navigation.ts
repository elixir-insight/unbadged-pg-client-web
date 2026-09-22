import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { onboarding } from '$lib/stores/onboarding.svelte';
import { routeToStep, type RoutedRemark } from '$lib/utils/remarkRouting';
import { routeSaveErrorToStep } from '$lib/utils/saveErrorRouting';
import { nextStepPath, stepHref, STEPS, type StepId, type StepPath } from './steps';

export async function gotoOnboardingStep(path: StepPath, fieldKey?: string): Promise<void> {
	onboarding.setFocusField(fieldKey ?? '');
	await goto(resolve(stepHref(path) as '/'));
}

/**
 * Shows a save/submit failure on the step whose fields it concerns, not wherever the request
 * happened to fire from — e.g. saving the profile step can fail on an identity-step field
 * (GST/TAN), which that step can't display or let the user fix. Returns the message to show
 * locally when it belongs on the current step (or can't be placed); returns '' after routing
 * elsewhere, since the target step will show it instead.
 */
export async function routeSaveError(message: string, currentStep: StepId): Promise<string> {
	const targetStep = routeSaveErrorToStep(message);
	if (targetStep === null || targetStep === currentStep) return message;
	onboarding.setSaveError(message);
	await gotoOnboardingStep(STEPS[targetStep - 1].path);
	return '';
}

export async function gotoRemark(remark: RoutedRemark): Promise<void> {
	await gotoOnboardingStep(STEPS[remark.step - 1].path, remark.key);
}

function clearStepRemarks(step: StepId): void {
	const remaining = { ...onboarding.verifications };
	let cleared = false;
	for (const key of Object.keys(remaining)) {
		if (routeToStep(key) === step) {
			delete remaining[key];
			cleared = true;
		}
	}
	if (cleared) onboarding.setVerifications(remaining);
}

/** Marks the step done, drops its management remarks, and moves to the next step. */
export async function advanceFromStep(step: StepId): Promise<void> {
	clearStepRemarks(step);
	onboarding.completeStep(step);
	const next = nextStepPath(step);
	if (next) await gotoOnboardingStep(next);
}
