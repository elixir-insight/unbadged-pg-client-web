<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { navigating, page } from '$app/state';
	import {
		getDocumentKeyForFieldName,
		toBankSaveSnapshot,
		toKybPayload,
		toSectionSnapshot
	} from '$lib/api/onboarding';
	import { branding } from '$lib/branding';
	import OnboardingMobileBar from '$lib/components/self-onboarding/onboarding-mobile-bar.svelte';
	import OnboardingSidebar from '$lib/components/self-onboarding/onboarding-sidebar.svelte';
	import RemarkBanner from '$lib/components/self-onboarding/remark-banner.svelte';
	import {
		isStepReachable,
		savedCompletedSteps
	} from '$lib/components/self-onboarding/saved-steps';
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
	/** Only what the backend holds counts — the same after a refresh, never just typed locally. */
	const completedSteps = $derived(savedCompletedSteps(data));
	/** Steps management flagged stay reachable so the user can fix them, whatever comes before. */
	const remarkSteps = $derived(allRoutedRemarks(data.verifications).map((remark) => remark.step));
	/** A step change re-fetches the saved state — hold the guard until it has landed. */
	const loading = $derived(navigating.to !== null);
	const displayName = $derived(
		onboarding.formData.businessDetails.brandName || merchantSession.session?.merchantName || ''
	);
	const onboardingStatus = $derived(onboarding.onboardingStatus);

	// Every visit starts empty and is filled from the API alone — runs before any child step
	// renders and before the hydrate* effects below. Nothing is kept in browser storage.
	onboarding.reset();

	// The wizard has no control for entity type any more (captured at signup instead) — fill it
	// in from the server-fetched organization record the first time it's available locally.
	$effect(() => {
		const entityType = parseEntityType(data.businessType);
		if (entityType) onboarding.hydrateEntityType(entityType);
	});

	// Everything already saved upstream (previous session, other browser) — fills only empty
	// fields, and records the server's copy as the baseline Continue compares against, so an
	// unchanged step moves on without re-saving (see onboarding.isDirty / seedClean). Opening the
	// wizard or moving between steps never saves — only Continue with a real change does.
	$effect(() => {
		if (data.prefill) {
			onboarding.hydrateFromOrganization(data.prefill);
			const saved = toKybPayload(data.prefill);
			for (const section of ['identity', 'address', 'directors'] as const) {
				onboarding.seedClean(section, toSectionSnapshot(section, saved));
			}
		}
		if (data.bankAccounts.length > 0) {
			onboarding.hydrateBankAccounts(data.bankAccounts);
			onboarding.seedClean('bankAccounts', toBankSaveSnapshot(data.bankAccounts));
		}
		for (const fieldName of data.uploadedFieldNames) {
			const key = getDocumentKeyForFieldName(fieldName);
			if (key) onboarding.hydrateDocumentUploaded(key);
		}
	});

	// Real profileStatus/verifications, re-fetched on every step change (see +layout.server.ts).
	// Remarks are only re-applied when the server's set actually changed: the load now re-runs on
	// each navigation, and re-applying an unchanged set would bring back a remark the user already
	// answered here (e.g. by uploading a replacement document) until they resubmit.
	let appliedVerifications: string | undefined;
	$effect(() => {
		onboarding.setProfileStatus(data.profileStatus);
		const next = JSON.stringify(data.verifications);
		if (next === appliedVerifications) return;
		appliedVerifications = next;
		onboarding.setVerifications(data.verifications);
	});

	// In review, approved, and later — no more edits. Always land on the read-only summary.
	// REMARKED stays in the wizard so only rejected fields can be corrected.
	$effect(() => {
		if (!browser || onboardingStatus !== 'read_only') return;
		if (currentStep === 6) return;
		void goto(resolve(stepHref('review-submit') as '/'), { replaceState: true });
	});

	// Steps unlock in order, by what's saved upstream; a step with a management remark is always
	// reachable. Opening a locked step (URL, back/forward) lands on the first unsaved one instead.
	// Doesn't apply once the application is read-only — the redirect above sends those to step 6.
	$effect(() => {
		if (!browser || loading || onboardingStatus === 'read_only') return;
		if (isStepReachable(currentStep, completedSteps, remarkSteps)) return;
		const first = firstIncompleteStep(completedSteps);
		void goto(resolve(stepHref(STEPS[first - 1].path) as '/'), { replaceState: true });
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
	<title>{branding.meta.titleTemplate(STEPS[currentStep - 1].title)}</title>
</svelte:head>

<div class="flex h-dvh overflow-hidden bg-muted md:gap-4 md:p-4">
	{#if isMd}
		<aside
			class="flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
		>
			<OnboardingSidebar
				{currentStep}
				{completedSteps}
				{remarkSteps}
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

		{#if remarks.length > 0 && !isMd}
			<div class="w-full shrink-0 px-4 pt-4">
				<RemarkBanner {remarks} onFix={(remark) => void gotoRemark(remark)} />
			</div>
		{/if}

		<!-- In the flow, not absolutely positioned: a `relative` wrapper around the step would
		     become the containing block of absolutely positioned bits inside its scroll area
		     (e.g. a file input), letting focus scroll this overflow-hidden panel. -->
		<div
			class={['h-0.5 shrink-0', loading && 'animate-pulse bg-primary']}
			role={loading ? 'progressbar' : undefined}
			aria-label={loading ? 'Loading your saved details' : undefined}
		></div>
		<div class="flex min-h-0 flex-1">
			<div class="min-h-0 min-w-0 flex-1" aria-busy={loading}>
				{@render children()}
			</div>
			{#if remarks.length > 0 && isMd}
				<aside class="w-80 shrink-0 overflow-y-auto border-l border-border/60 p-4">
					<RemarkBanner {remarks} onFix={(remark) => void gotoRemark(remark)} />
				</aside>
			{/if}
		</div>
	</main>
</div>
