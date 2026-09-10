export const STAGE_NAV_KEY = Symbol('self-onboarding-stage-nav');

export interface StageNavConfig {
	canContinue: boolean;
	onContinue: () => void;
	label: string;
	secondaryLabel?: string;
	onSecondary?: () => void;
	hint?: string;
}

export function createStageNav() {
	let tabbed = $state(false);
	let canContinue = $state(false);
	let label = $state('Continue');
	let secondaryLabel = $state<string | undefined>(undefined);
	let hint = $state<string | undefined>(undefined);
	let onContinue: () => void = () => {};
	let onSecondary: (() => void) | undefined;

	return {
		get tabbed() {
			return tabbed;
		},
		setTabbed(value: boolean) {
			if (tabbed !== value) tabbed = value;
		},
		get canContinue() {
			return canContinue;
		},
		get label() {
			return label;
		},
		get secondaryLabel() {
			return secondaryLabel;
		},
		get hint() {
			return hint;
		},
		runContinue() {
			onContinue();
		},
		runSecondary() {
			onSecondary?.();
		},
		setConfig(next: StageNavConfig) {
			onContinue = next.onContinue;
			onSecondary = next.onSecondary;
			if (canContinue !== next.canContinue) canContinue = next.canContinue;
			if (label !== next.label) label = next.label;
			if (secondaryLabel !== next.secondaryLabel) secondaryLabel = next.secondaryLabel;
			if (hint !== next.hint) hint = next.hint;
		}
	};
}

export type StageNav = ReturnType<typeof createStageNav>;
