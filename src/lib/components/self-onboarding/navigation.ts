import { tick } from 'svelte';
import type { ActionResult } from '@sveltejs/kit';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { onboarding } from '$lib/stores/onboarding.svelte';
import { routeToStep, type RoutedRemark } from '$lib/utils/remarkRouting';
import { mapSaveError } from '$lib/utils/saveErrorRouting';
import { nextStepPath, stepHref, STEPS, type StepId, type StepPath } from './steps';

export async function gotoOnboardingStep(path: StepPath, fieldKey?: string): Promise<void> {
	onboarding.setFocusField(fieldKey ?? '');
	await goto(resolve(stepHref(path) as '/'));
}

/** Shown for failures that aren't a backend rejection (network, timeout, unexpected response). */
export const GENERIC_SAVE_ERROR = 'Something went wrong. Please try again.';

/** A failed step action's message, and the field the backend named when it named one. */
export function actionFailure(result: ActionResult): { message: string; field?: string } {
	if (result.type !== 'failure' || !result.data) return { message: GENERIC_SAVE_ERROR };
	const { error, field } = result.data as { error?: unknown; field?: unknown };
	return {
		message: typeof error === 'string' && error.trim() ? error : GENERIC_SAVE_ERROR,
		...(typeof field === 'string' && field && { field })
	};
}

/** Scrolls the input with this key (FieldRow `remarkKey`) into view and focuses it. */
async function revealField(fieldKey: string): Promise<void> {
	await tick();
	const target = document.querySelector(`[data-remark-field="${fieldKey.replaceAll('"', '')}"]`);
	if (!target) return;
	target.scrollIntoView({ behavior: 'smooth', block: 'center' });
	target
		.querySelector<HTMLElement>('input, textarea, select, button')
		?.focus({ preventScroll: true });
}

/**
 * Shows a save/submit failure where it belongs (see mapSaveError): under the field(s) it names,
 * on the step that owns them — navigating there when that isn't the current step (e.g. a GSTIN
 * claimed by another org, reported by the final submit). The message itself is the caller's toast.
 * Returns the message when it names no field on the current step (nothing to pin it under), ''
 * otherwise.
 */
export async function routeSaveError(
	message: string,
	currentStep: StepId,
	field?: string
): Promise<string> {
	const target = mapSaveError(message, {
		currentStep,
		field,
		sameAsCommunication: onboarding.formData.businessDetails.sameAsCommunication,
		directors: onboarding.formData.directors
	});
	onboarding.setFieldSaveErrors(target.fields, message);
	const [firstField] = target.fields;
	if (target.step !== null && target.step !== currentStep) {
		await gotoOnboardingStep(STEPS[target.step - 1].path);
		if (firstField) await revealField(firstField);
		return '';
	}
	if (!firstField) return message;
	await revealField(firstField);
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

/**
 * Drops the step's management remarks and moves to the next step — only after its save
 * succeeded. The navigation re-runs the layout load, so the route guard and sidebar see the
 * newly saved state before the next step renders (see savedCompletedSteps).
 */
export async function advanceFromStep(step: StepId): Promise<void> {
	clearStepRemarks(step);
	onboarding.clearFieldSaveError();
	const next = nextStepPath(step);
	if (next) await gotoOnboardingStep(next);
}
