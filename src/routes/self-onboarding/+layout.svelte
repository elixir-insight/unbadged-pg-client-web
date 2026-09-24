<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import OnboardingMobileBar from '$lib/components/self-onboarding/onboarding-mobile-bar.svelte';
	import OnboardingSidebar from '$lib/components/self-onboarding/onboarding-sidebar.svelte';
	import RemarkBanner from '$lib/components/self-onboarding/remark-banner.svelte';
	import { gotoOnboardingStep, gotoRemark } from '$lib/components/self-onboarding/navigation';
	import {
		firstIncompleteStep,
		stepHref,
		STEPS,
		stepIdFromPathname
	} from '$lib/components/self-onboarding/steps';
	import { merchantSession } from '$lib/stores/auth/session.svelte';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { parseEntityType } from '$lib/types/onboarding';
	import { allRoutedRemarks } from '$lib/utils/remarkRouting';

	let { data, children } = $props();

	const MD_QUERY = '(min-width: 768px)';
	let isMd = $state(browser ? window.matchMedia(MD_QUERY).matches : true);

	const currentStep = $derived(stepIdFromPathname(page.url.pathname));
	const remarks = $derived(allRoutedRemarks(onboarding.verifications));
	const displayName = $derived(
		onboarding.formData.businessDetails.brandName || merchantSession.session?.merchantName || ''
	);
	const onboardingStatus = $derived(onboarding.onboardingStatus);

	// The wizard has no control for entity type any more (captured at signup instead) — fill it
	// in from the server-fetched organization record the first time it's available locally.
	$effect(() => {
		const entityType = parseEntityType(data.businessType);
		if (entityType) onboarding.hydrateEntityType(entityType);
	});

	// Real profileStatus/verifications, fetched once per layout mount (see +layout.server.ts) —
	// re-set on every load so a status change or a resolved remark is never shown stale.
	$effect(() => {
		onboarding.setProfileStatus(data.profileStatus);
		onboarding.setVerifications(data.verifications);
	});

	// Submitted / under review / approved — no more edits. Always land on the read-only summary.
	$effect(() => {
		if (!browser || onboardingStatus !== 'read_only') return;
		if (currentStep === 6) return;
		void goto(resolve(stepHref('review-submit') as '/'), { replaceState: true });
	});

	// Steps unlock in order; a step with a management remark is always reachable. Doesn't apply
	// once the application is read-only — the redirect above sends those straight to step 6
	// regardless of completedSteps, which may be empty if this browser never ran the flow.
	$effect(() => {
		if (!browser || onboardingStatus === 'read_only') return;
		const allowed = firstIncompleteStep(onboarding.completedSteps);
		if (currentStep <= allowed || remarks.some((remark) => remark.step === currentStep)) return;
		void goto(resolve(stepHref(STEPS[allowed - 1].path) as '/'), { replaceState: true });
	});

	$effect(() => {
		JSON.stringify({
			pan: onboarding.formData.businessPan,
			entityType: onboarding.formData.entityType,
			gstin: onboarding.formData.gstin,
			business: onboarding.formData.businessDetails,
			bank: onboarding.formData.bankAccounts,
			directors: onboarding.formData.directors,
			documents: onboarding.formData.documents,
			mode: onboarding.mode,
			completedSteps: onboarding.completedSteps,
			verifications: onboarding.verifications,
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
</script>

<svelte:head>
	<title>{STEPS[currentStep - 1].title} | ElixirPay</title>
</svelte:head>

<div class="flex h-dvh overflow-hidden bg-muted md:gap-4 md:p-4">
	{#if isMd}
		<aside
			class="flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
		>
			<OnboardingSidebar
				{currentStep}
				completedSteps={onboarding.completedSteps}
				{displayName}
				onNavigate={(path) => void gotoOnboardingStep(path)}
			/>
		</aside>
	{/if}

	<main
		class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card md:rounded-2xl md:border md:border-border md:shadow-sm"
	>
		{#if !isMd}
			<OnboardingMobileBar {currentStep} />
		{/if}

		{#if remarks.length > 0}
			<div class="mx-auto w-full max-w-[640px] shrink-0 px-6 pt-4">
				<RemarkBanner {remarks} onFix={(remark) => void gotoRemark(remark)} />
			</div>
		{/if}

		<div class="min-h-0 flex-1">
			{@render children()}
		</div>
	</main>
</div>
