import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { onboarding } from '$lib/stores/onboarding.svelte';
import { allRoutedRemarks, routeToTab, type RoutedRemark } from '$lib/utils/remarkRouting';
import { nextActionableTab, resumeTabForStage } from './stage-status';
import { previousTab, stageByKey, type StageKey, type StageTabId } from './stages';
import { stepHref, type StepPath } from './steps';

export async function gotoOnboardingStep(path: StepPath): Promise<void> {
	await goto(resolve(stepHref(path) as '/'));
}

export async function gotoOnboardingTab(tabId: StageTabId, fieldKey?: string): Promise<void> {
	onboarding.setFocusField(fieldKey ?? '');
	if (tabId === 'address') {
		onboarding.setBusinessSection('address');
	} else if (tabId === 'company') {
		onboarding.setBusinessSection('company');
	}

	switch (tabId) {
		case 'pan':
			await goto(resolve('/self-onboarding/pan-number'));
			return;
		case 'gst':
			await goto(resolve('/self-onboarding/gst-details'));
			return;
		case 'company':
		case 'address':
			await goto(resolve('/self-onboarding/business-details'));
			return;
		case 'bank':
			await goto(resolve('/self-onboarding/bank-details'));
			return;
		case 'directors':
			await goto(resolve('/self-onboarding/directors'));
			return;
	}
}

export async function gotoOnboardingStage(stageKey: StageKey): Promise<void> {
	const stage = stageByKey(stageKey);
	if (stage.tabs.length > 0) {
		const remarks = allRoutedRemarks(onboarding.verifications);
		const target = resumeTabForStage(stageKey, onboarding.formData, remarks) ?? stage.tabs[0].id;
		await gotoOnboardingTab(target);
		return;
	}
	if (stageKey === 'review-submit') {
		await goto(resolve('/self-onboarding/review-submit'));
		return;
	}
	await goto(resolve('/self-onboarding/documents'));
}

export async function gotoRemark(remark: RoutedRemark): Promise<void> {
	await gotoOnboardingTab(remark.tab, remark.key);
}

export async function gotoPreviousFromTab(tabId: StageTabId): Promise<void> {
	const previous = previousTab(tabId);
	if (previous) {
		await gotoOnboardingTab(previous.id);
	}
}

function completeTab(tab: StageTabId): void {
	const remaining = { ...onboarding.verifications };
	let cleared = false;
	for (const key of Object.keys(remaining)) {
		if (routeToTab(key) === tab) {
			delete remaining[key];
			cleared = true;
		}
	}
	if (cleared) onboarding.setVerifications(remaining);

	switch (tab) {
		case 'pan':
			onboarding.completeStep(1);
			break;
		case 'gst':
			onboarding.completeStep(2);
			break;
		case 'company':
			break;
		case 'address':
			onboarding.completeStep(3);
			break;
		case 'bank':
			onboarding.completeStep(4);
			break;
		case 'directors':
			onboarding.completeStep(5);
			break;
	}
}

export async function advanceFromTab(tab: StageTabId): Promise<void> {
	completeTab(tab);
	const remarks = allRoutedRemarks(onboarding.verifications);
	const next = nextActionableTab(tab, onboarding.formData, remarks);
	if (next.kind === 'tab') {
		await gotoOnboardingTab(next.id);
		return;
	}
	await gotoOnboardingStage(next.key);
}
