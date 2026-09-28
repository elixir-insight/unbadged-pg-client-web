import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { onboarding } from '$lib/stores/onboarding.svelte';
import { routeToStep, type RoutedRemark } from '$lib/utils/remarkRouting';
import { routeSaveErrorToField, routeSaveErrorToStep } from '$lib/utils/saveErrorRouting';
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
	const targetStep = routeSaveErrorToStep(message, currentStep);
	if (targetStep === null) return message;
	// Naming a single identity field (e.g. "Invalid GST Format") — show it under that field
	// instead of the footer, and highlight it. Only for step 1: a director's "Invalid PAN" kept on
	// step 4 must not be pinned under the business PAN.
	const fieldKey = targetStep === 1 ? routeSaveErrorToField(message) : null;
	if (fieldKey) onboarding.setFieldSaveError(fieldKey, message);
	if (targetStep === currentStep) {
		if (!fieldKey) return message;
		onboarding.setFocusField(fieldKey);
		return '';
	}
	if (!fieldKey) onboarding.setSaveError(message);
	await gotoOnboardingStep(STEPS[targetStep - 1].path, fieldKey ?? undefined);
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
	onboarding.clearFieldSaveError();
	onboarding.completeStep(step);
	const next = nextStepPath(step);
	if (next) await gotoOnboardingStep(next);
}
