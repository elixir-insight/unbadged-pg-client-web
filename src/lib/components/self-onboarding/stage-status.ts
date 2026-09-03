import type { OnboardingFormData } from '$lib/types/onboarding';
import { allRoutedRemarks, routeToStage, type RoutedRemark } from '$lib/utils/remarkRouting';
import { STAGES, stageByKey, type StageKey, type StageStatus, type StageTabId } from './stages';
import {
	bankDetailsAreComplete,
	directorsAreComplete,
	isValidGstin,
	isValidPan,
	requiredDocumentsUploaded
} from './validation';

/**
 * profileStatus values except REMARKED are ⚠ dummy placeholders.
 * Confirm the real enum with backend before shipping (redesign §6 item 2).
 */
export type ProfileStatus =
	'DRAFT' | 'SUBMITTED' | 'VERIFICATION_PENDING' | 'VERIFIED' | 'REMARKED';

export interface OrgResponseLike {
	profileStatus?: string | null;
	verifications?: Record<string, string>;
}

function filled(value: string): boolean {
	return value.trim().length > 0;
}

export function isCompanyTabComplete(data: OnboardingFormData): boolean {
	const details = data.businessDetails;
	return (
		filled(details.companyName) &&
		filled(details.companyType) &&
		filled(details.email) &&
		filled(details.phone)
	);
}

export function isAddressTabComplete(data: OnboardingFormData): boolean {
	const details = data.businessDetails;
	const registered =
		filled(details.address.line1) &&
		filled(details.address.city) &&
		filled(details.address.state) &&
		filled(details.address.pincode);
	if (!registered) return false;
	if (details.currentAddressSameAsContact) return true;
	return (
		filled(details.currentAddress.line1) &&
		filled(details.currentAddress.city) &&
		filled(details.currentAddress.state) &&
		filled(details.currentAddress.pincode)
	);
}

export function isPanTabComplete(data: OnboardingFormData): boolean {
	return isValidPan(data.businessPan) && data.entityType !== null;
}

export function isGstTabComplete(data: OnboardingFormData): boolean {
	return isValidGstin(data.gstin);
}

export function isTabComplete(tab: StageTabId, data: OnboardingFormData): boolean {
	switch (tab) {
		case 'pan':
			return isPanTabComplete(data);
		case 'gst':
			return isGstTabComplete(data);
		case 'company':
			return isCompanyTabComplete(data);
		case 'address':
			return isAddressTabComplete(data);
		case 'bank':
			return bankDetailsAreComplete(data);
		case 'directors':
			return directorsAreComplete(data);
	}
}

export function stageFieldsComplete(stage: StageKey, data: OnboardingFormData): boolean {
	if (stage === 'documents') {
		return requiredDocumentsUploaded(data.documents);
	}
	if (stage === 'review-submit') {
		return STAGES.slice(0, 3).every((item) => stageFieldsComplete(item.key, data));
	}
	const definition = stageByKey(stage);
	if (definition.tabs.length === 0) return false;
	return definition.tabs.every((tab) => isTabComplete(tab.id, data));
}

function isPendingStatus(profileStatus: string | null | undefined): boolean {
	return profileStatus === 'VERIFICATION_PENDING' || profileStatus === 'SUBMITTED';
}

function isVerifiedStatus(profileStatus: string | null | undefined): boolean {
	return profileStatus === 'VERIFIED';
}

export function deriveStageStatus(
	stage: StageKey,
	res: OrgResponseLike,
	data: OnboardingFormData
): StageStatus {
	const remarkKeys = Object.keys(res.verifications ?? {});
	const hasRemark = remarkKeys.some((key) => routeToStage(key) === stage);
	if (hasRemark) return 'changes_required';

	if (!stageFieldsComplete(stage, data)) return 'draft';

	if (isPendingStatus(res.profileStatus)) return 'verification_pending';
	if (isVerifiedStatus(res.profileStatus) && stageFieldsComplete(stage, data)) return 'verified';

	return 'verification_pending';
}

export function isStageUnlocked(stage: StageKey, statuses: Record<StageKey, StageStatus>): boolean {
	const index = STAGES.findIndex((item) => item.key === stage);
	if (index <= 0) return true;
	if (statuses[stage] === 'changes_required') return true;

	if (stage === 'review-submit') {
		const prior = STAGES.slice(0, 3);
		const anyRemark = prior.some((item) => statuses[item.key] === 'changes_required');
		if (anyRemark) return false;
		return prior.every((item) => {
			const status = statuses[item.key];
			return status === 'verified' || status === 'verification_pending';
		});
	}

	const previous = STAGES[index - 1];
	if (!previous) return true;
	const previousStatus = statuses[previous.key];
	return (
		previousStatus === 'verification_pending' ||
		previousStatus === 'verified' ||
		previousStatus === 'changes_required'
	);
}

export function deriveAllStageStatuses(
	res: OrgResponseLike,
	data: OnboardingFormData
): Record<StageKey, StageStatus> {
	const derived = Object.fromEntries(
		STAGES.map((stage) => [stage.key, deriveStageStatus(stage.key, res, data)])
	) as Record<StageKey, StageStatus>;

	for (const stage of STAGES) {
		if (!isStageUnlocked(stage.key, derived) && derived[stage.key] === 'draft') {
			derived[stage.key] = 'locked';
		}
	}

	return derived;
}

export function nextActionableTab(
	from: StageTabId,
	data: OnboardingFormData,
	remarks: RoutedRemark[]
): { kind: 'tab'; id: StageTabId } | { kind: 'stage'; key: StageKey } {
	const remarkedTabs = new Set(remarks.map((remark) => remark.tab));
	const fromStage = STAGES.find((stage) => stage.tabs.some((tab) => tab.id === from));
	if (!fromStage) return { kind: 'stage', key: 'documents' };

	const fromIndex = fromStage.tabs.findIndex((tab) => tab.id === from);
	for (const tab of fromStage.tabs.slice(fromIndex + 1)) {
		if (remarkedTabs.has(tab.id) || !isTabComplete(tab.id, data)) {
			return { kind: 'tab', id: tab.id };
		}
	}

	const stageIndex = STAGES.findIndex((stage) => stage.key === fromStage.key);
	const next = STAGES[stageIndex + 1];
	if (!next) return { kind: 'stage', key: 'review-submit' };
	if (next.tabs.length > 0) {
		const remarkedInNext = next.tabs.find((tab) => remarkedTabs.has(tab.id));
		if (remarkedInNext) return { kind: 'tab', id: remarkedInNext.id };
		const incomplete = next.tabs.find((tab) => !isTabComplete(tab.id, data));
		if (incomplete) return { kind: 'tab', id: incomplete.id };
		return { kind: 'tab', id: next.tabs[0].id };
	}
	return { kind: 'stage', key: next.key };
}

export function resumeTabForStage(
	stage: StageKey,
	data: OnboardingFormData,
	remarks: RoutedRemark[]
): StageTabId | null {
	const definition = stageByKey(stage);
	if (definition.tabs.length === 0) return null;

	const stageRemarks = remarks.filter((remark) => remark.stage === stage);
	if (stageRemarks[0]) return stageRemarks[0].tab;

	const incomplete = definition.tabs.find((tab) => !isTabComplete(tab.id, data));
	if (incomplete) return incomplete.id;

	return definition.tabs[definition.tabs.length - 1]?.id ?? null;
}

export function resumeDestination(
	data: OnboardingFormData,
	res: OrgResponseLike
): { kind: 'tab'; id: StageTabId } | { kind: 'stage'; key: StageKey } {
	const remarks = allRoutedRemarks(res.verifications);
	if (remarks[0]) {
		return { kind: 'tab', id: remarks[0].tab };
	}

	for (const stage of STAGES) {
		if (stage.tabs.length > 0) {
			const incomplete = stage.tabs.find((tab) => !isTabComplete(tab.id, data));
			if (incomplete) return { kind: 'tab', id: incomplete.id };
			continue;
		}
		if (!stageFieldsComplete(stage.key, data)) {
			return { kind: 'stage', key: stage.key };
		}
	}

	return { kind: 'stage', key: 'review-submit' };
}

export function isTabLocked(
	tab: StageTabId,
	data: OnboardingFormData,
	remarks: RoutedRemark[]
): boolean {
	if (remarks.some((remark) => remark.tab === tab)) return false;

	const stage = STAGES.find((item) => item.tabs.some((itemTab) => itemTab.id === tab));
	if (!stage) return false;

	const index = stage.tabs.findIndex((item) => item.id === tab);
	if (index <= 0) {
		const stageIndex = STAGES.findIndex((item) => item.key === stage.key);
		if (stageIndex <= 0) return false;
		return !stageFieldsComplete(STAGES[stageIndex - 1].key, data);
	}

	const previous = stage.tabs[index - 1];
	if (!previous) return false;
	return !isTabComplete(previous.id, data) && !remarks.some((remark) => remark.tab === previous.id);
}
