import { SELF_ONBOARDING_BASE, STEPS, type StepPath } from './steps';

export type StageKey = 'business-details' | 'account-ownership' | 'documents' | 'review-submit';

export type StageTabId = 'pan' | 'gst' | 'company' | 'address' | 'bank' | 'directors';

export type StageStatus =
	'verified' | 'current' | 'locked' | 'verification_pending' | 'changes_required' | 'draft';

export interface StageTab {
	id: StageTabId;
	label: string;
	stepPath: StepPath;
	query?: Record<string, string>;
	eyebrow: string;
	title: string;
	description: string;
}

export interface Stage {
	key: StageKey;
	label: string;
	path: StepPath;
	tabs: StageTab[];
}

export const ADDRESS_TAB_META = {
	eyebrow: 'Where should we reach you?',
	title: 'Address',
	description: 'Enter the registered and operating addresses for this business.'
} as const;

const PAN_STEP = STEPS[0];
const GST_STEP = STEPS[1];
const COMPANY_STEP = STEPS[2];
const BANK_STEP = STEPS[3];
const DIRECTORS_STEP = STEPS[4];

export const STAGES: readonly Stage[] = [
	{
		key: 'business-details',
		label: 'Business Details',
		path: 'pan-number',
		tabs: [
			{
				id: 'pan',
				label: PAN_STEP.tabLabel,
				stepPath: PAN_STEP.path,
				eyebrow: PAN_STEP.eyebrow,
				title: PAN_STEP.title,
				description: PAN_STEP.description
			},
			{
				id: 'gst',
				label: GST_STEP.tabLabel,
				stepPath: GST_STEP.path,
				eyebrow: GST_STEP.eyebrow,
				title: GST_STEP.title,
				description: GST_STEP.description
			},
			{
				id: 'company',
				label: COMPANY_STEP.tabLabel,
				stepPath: COMPANY_STEP.path,
				eyebrow: COMPANY_STEP.eyebrow,
				title: COMPANY_STEP.title,
				description: COMPANY_STEP.description
			},
			{
				id: 'address',
				label: 'Address',
				stepPath: 'business-details',
				query: { tab: 'address' },
				eyebrow: ADDRESS_TAB_META.eyebrow,
				title: ADDRESS_TAB_META.title,
				description: ADDRESS_TAB_META.description
			}
		]
	},
	{
		key: 'account-ownership',
		label: 'Account & Ownership',
		path: 'bank-details',
		tabs: [
			{
				id: 'bank',
				label: BANK_STEP.tabLabel,
				stepPath: BANK_STEP.path,
				eyebrow: BANK_STEP.eyebrow,
				title: BANK_STEP.title,
				description: BANK_STEP.description
			},
			{
				id: 'directors',
				label: DIRECTORS_STEP.tabLabel,
				stepPath: DIRECTORS_STEP.path,
				eyebrow: DIRECTORS_STEP.eyebrow,
				title: DIRECTORS_STEP.title,
				description: DIRECTORS_STEP.description
			}
		]
	},
	{
		key: 'documents',
		label: 'Documents',
		path: 'documents',
		tabs: []
	},
	{
		key: 'review-submit',
		label: 'Review & Submit',
		path: 'review-submit',
		tabs: []
	}
];

export const TABBED_STAGE_KEYS: readonly StageKey[] = ['business-details', 'account-ownership'];

export function stageHref(stage: Stage): `${typeof SELF_ONBOARDING_BASE}/${StepPath}` {
	return `${SELF_ONBOARDING_BASE}/${stage.path}`;
}

export function stageTabHref(tab: StageTab): string {
	const path = `${SELF_ONBOARDING_BASE}/${tab.stepPath}`;
	if (!tab.query) return path;
	const params = new URLSearchParams(tab.query);
	return `${path}?${params.toString()}`;
}

export function stageByKey(key: StageKey): Stage {
	const stage = STAGES.find((item) => item.key === key);
	if (!stage) {
		return STAGES[0];
	}
	return stage;
}

export function stageByTabId(tabId: StageTabId): Stage {
	const stage = STAGES.find((item) => item.tabs.some((tab) => tab.id === tabId));
	if (!stage) {
		return STAGES[0];
	}
	return stage;
}

export function tabById(tabId: StageTabId): StageTab {
	for (const stage of STAGES) {
		const tab = stage.tabs.find((item) => item.id === tabId);
		if (tab) return tab;
	}
	return STAGES[0].tabs[0];
}

export function stageIndexFromKey(key: StageKey): number {
	const index = STAGES.findIndex((stage) => stage.key === key);
	return index >= 0 ? index : 0;
}

export function currentTabFromLocation(
	pathname: string,
	businessSection: 'company' | 'address' = 'company'
): StageTabId | null {
	const segment = pathname.split('/').at(-1);
	if (segment === 'pan-number') return 'pan';
	if (segment === 'gst-details') return 'gst';
	if (segment === 'business-details') {
		return businessSection === 'address' ? 'address' : 'company';
	}
	if (segment === 'bank-details') return 'bank';
	if (segment === 'directors') return 'directors';
	return null;
}

export function currentStageFromLocation(
	pathname: string,
	businessSection: 'company' | 'address' = 'company'
): Stage {
	const tab = currentTabFromLocation(pathname, businessSection);
	if (tab) return stageByTabId(tab);
	const segment = pathname.split('/').at(-1);
	if (segment === 'documents') return stageByKey('documents');
	if (segment === 'review-submit') return stageByKey('review-submit');
	return STAGES[0];
}

export function stageHasTabs(stage: Stage): boolean {
	return stage.tabs.length > 0;
}

export function previousTab(tabId: StageTabId): StageTab | null {
	const stage = stageByTabId(tabId);
	const index = stage.tabs.findIndex((tab) => tab.id === tabId);
	if (index > 0) return stage.tabs[index - 1] ?? null;

	const stageIndex = stageIndexFromKey(stage.key);
	if (stageIndex <= 0) return null;
	const previous = STAGES[stageIndex - 1];
	if (!previous) return null;
	if (previous.tabs.length > 0) {
		return previous.tabs[previous.tabs.length - 1] ?? null;
	}
	return null;
}

export function flooredStageProgress(actualPercent: number, currentStageIndex: number): number {
	return Math.max(actualPercent, currentStageIndex === 0 ? Math.round(100 / STAGES.length) : 0);
}
