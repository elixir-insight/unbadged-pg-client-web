<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import OnboardingHeader from '$lib/components/self-onboarding/onboarding-header.svelte';
	import type { OnboardingHeaderPill } from '$lib/components/self-onboarding/onboarding-header.svelte';
	import OnboardingMobileBar from '$lib/components/self-onboarding/onboarding-mobile-bar.svelte';
	import OnboardingSidebar from '$lib/components/self-onboarding/onboarding-sidebar.svelte';
	import RemarkBanner from '$lib/components/self-onboarding/remark-banner.svelte';
	import StageTabs from '$lib/components/self-onboarding/stage-tabs.svelte';
	import {
		gotoOnboardingStage,
		gotoOnboardingTab,
		gotoPreviousFromTab,
		gotoRemark
	} from '$lib/components/self-onboarding/navigation';
	import { createStageNav, STAGE_NAV_KEY } from '$lib/components/self-onboarding/stage-nav.svelte';
	import {
		deriveAllStageStatuses,
		isTabLocked
	} from '$lib/components/self-onboarding/stage-status';
	import {
		currentStageFromLocation,
		currentTabFromLocation,
		previousTab,
		stageHasTabs,
		STAGES,
		tabById,
		type StageKey,
		type StageStatus
	} from '$lib/components/self-onboarding/stages';
	import { STEPS, stepIndexFromPathname } from '$lib/components/self-onboarding/steps';
	import { getUserInitials } from '$lib/stores/auth/display';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { ENTITY_TYPE_LABELS } from '$lib/types/onboarding';
	import { allRoutedRemarks } from '$lib/utils/remarkRouting';

	let { children } = $props();

	const MD_QUERY = '(min-width: 768px)';
	let isMd = $state(browser ? window.matchMedia(MD_QUERY).matches : true);

	const stageNav = createStageNav();
	setContext(STAGE_NAV_KEY, stageNav);

	const orgResponse = $derived({
		profileStatus: onboarding.profileStatus,
		verifications: onboarding.verifications
	});
	const remarks = $derived(allRoutedRemarks(onboarding.verifications));
	const currentStage = $derived(
		currentStageFromLocation(page.url.pathname, onboarding.businessSection)
	);
	const currentTab = $derived(
		currentTabFromLocation(page.url.pathname, onboarding.businessSection)
	);
	const tabbed = $derived(stageHasTabs(currentStage));
	const currentTabLabel = $derived(
		currentTab
			? tabById(currentTab).label
			: (STEPS[stepIndexFromPathname(page.url.pathname) - 1]?.tabLabel ?? currentStage.label)
	);

	const derivedStatuses = $derived(deriveAllStageStatuses(orgResponse, onboarding.formData));
	const stageStatuses = $derived.by((): Record<StageKey, StageStatus> => {
		const next = { ...derivedStatuses };
		if (next[currentStage.key] === 'draft') {
			next[currentStage.key] = 'current';
		}
		return next;
	});

	const displayName = $derived(
		onboarding.formData.businessDetails.brandName ||
			onboarding.formData.businessDetails.companyName ||
			merchantSession.session?.merchantName ||
			''
	);
	const monogram = $derived(displayName ? getUserInitials(displayName) : '?');

	const showBack = $derived(Boolean(currentTab && previousTab(currentTab)));

	const headerTitle = $derived(displayName || 'Business onboarding');
	const headerSubtitle = $derived.by(() => {
		const entity = onboarding.formData.entityType
			? ENTITY_TYPE_LABELS[onboarding.formData.entityType]
			: 'Business';
		const status = stageStatuses[currentStage.key];
		const statusLabel =
			status === 'changes_required'
				? 'Changes required'
				: status === 'verification_pending'
					? 'Verification in progress'
					: status === 'verified'
						? 'Verified'
						: 'In Progress';
		return `${entity} · ${statusLabel}`;
	});

	const headerPills = $derived.by((): OnboardingHeaderPill[] => {
		if (tabbed && currentStage.tabs.length > 0) {
			return currentStage.tabs.map((tab) => ({
				id: tab.id,
				label: tab.label,
				locked: isTabLocked(tab.id, onboarding.formData, remarks)
			}));
		}
		return STAGES.map((stage) => ({
			id: stage.key,
			label: stage.label,
			locked: stageStatuses[stage.key] === 'locked'
		}));
	});

	const headerActiveId = $derived(tabbed && currentTab ? currentTab : currentStage.key);

	$effect(() => {
		stageNav.setTabbed(tabbed);
	});

	$effect(() => {
		JSON.stringify({
			pan: onboarding.formData.businessPan,
			entityType: onboarding.formData.entityType,
			gstin: onboarding.formData.gstin,
			gstinList: onboarding.formData.gstinList,
			business: onboarding.formData.businessDetails,
			bank: onboarding.formData.bankDetails,
			directors: onboarding.formData.directors,
			documents: onboarding.formData.documents,
			mode: onboarding.mode,
			completedSteps: onboarding.completedSteps,
			profileStatus: onboarding.profileStatus,
			verifications: onboarding.verifications,
			businessSection: onboarding.businessSection,
			focusField: onboarding.focusField
		});
		onboarding.persist();
	});

	$effect(() => {
		const field = onboarding.focusField;
		if (!browser || !field) return;
		const frame = requestAnimationFrame(() => {
			const target = document.querySelector(`[data-remark-field="${field.replaceAll('"', '')}"]`);
			target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		});
		return () => cancelAnimationFrame(frame);
	});

	onMount(() => {
		theme.init();

		const media = window.matchMedia(MD_QUERY);
		const onChange = (event: MediaQueryListEvent) => {
			isMd = event.matches;
		};
		isMd = media.matches;
		media.addEventListener('change', onChange);
		return () => media.removeEventListener('change', onChange);
	});

	function handleStageNavigate(key: StageKey) {
		void gotoOnboardingStage(key);
	}

	function handleBack() {
		if (currentTab) void gotoPreviousFromTab(currentTab);
	}

	function handleHeaderSelect(id: string) {
		if (tabbed) {
			const tab = currentStage.tabs.find((item) => item.id === id);
			if (tab) void gotoOnboardingTab(tab.id);
			return;
		}
		const stage = STAGES.find((item) => item.key === id);
		if (stage) void gotoOnboardingStage(stage.key);
	}

	const pageTitle = $derived(
		currentTab
			? tabById(currentTab).title
			: (STEPS[stepIndexFromPathname(page.url.pathname) - 1]?.title ?? 'Onboarding')
	);
</script>

<svelte:head>
	<title>{pageTitle} | ElixirPay</title>
</svelte:head>

<div class="flex h-dvh overflow-hidden bg-background">
	{#if isMd}
		<aside class="flex h-full w-96 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
			<OnboardingSidebar
				currentStage={currentStage.key}
				{currentTabLabel}
				{stageStatuses}
				{displayName}
				{monogram}
				onNavigate={handleStageNavigate}
			/>
		</aside>
	{/if}

	<main class="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
		{#if !isMd}
			<OnboardingMobileBar currentStage={currentStage.key} {currentTabLabel} />
		{/if}

		<div class="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-6 sm:px-8">
			<OnboardingHeader
				title={headerTitle}
				subtitle={headerSubtitle}
				pills={headerPills}
				activeId={headerActiveId}
				onSelect={handleHeaderSelect}
			/>

			<div
				class="relative flex min-h-112 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card px-6 py-5 shadow-sm"
			>
				{#if remarks.length > 0}
					<div class="shrink-0 pb-4">
						<RemarkBanner {remarks} onFix={(remark) => void gotoRemark(remark)} />
					</div>
				{/if}

				{#if tabbed && currentTab}
					<div class="flex min-h-0 flex-1 flex-col">
						<StageTabs
							canContinue={stageNav.canContinue}
							continueLabel={stageNav.label}
							onContinue={() => stageNav.runContinue()}
							secondaryLabel={stageNav.secondaryLabel}
							onSecondary={() => stageNav.runSecondary()}
							hint={stageNav.hint}
							{showBack}
							onBack={handleBack}
						>
							{@render children()}
						</StageTabs>
					</div>
				{:else}
					<div class="min-h-0 flex-1 overflow-hidden">
						{@render children()}
					</div>
				{/if}
			</div>
		</div>
	</main>
</div>
