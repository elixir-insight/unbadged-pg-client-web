<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getContext } from 'svelte';
	import { page } from '$app/state';
	import { Button } from '$lib/components/reusable';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { gotoOnboardingStep } from './navigation';
	import { STAGE_NAV_KEY, type StageNav } from './stage-nav.svelte';
	import { ADDRESS_TAB_META } from './stages';
	import { previousStepPath, STEPS, stepIndexFromPathname } from './steps';

	let {
		children,
		footer,
		header
	}: {
		children: Snippet;
		footer?: Snippet;
		header?: Snippet;
	} = $props();

	const stageNav = getContext<StageNav | undefined>(STAGE_NAV_KEY);
	const hideFooter = $derived(stageNav?.tabbed ?? false);
	const currentStep = $derived(stepIndexFromPathname(page.url.pathname));
	const isAddressTab = $derived(onboarding.businessSection === 'address');
	const meta = $derived(isAddressTab ? ADDRESS_TAB_META : STEPS[currentStep - 1]);
	const backPath = $derived(previousStepPath(currentStep));
</script>

<div class="flex h-full min-h-0 flex-col">
	<div class="min-h-0 flex-1 overflow-y-auto">
		{#if header}
			{@render header()}
		{:else}
			<header class="mb-6">
				{#if meta?.eyebrow}
					<p class="text-sm font-medium text-primary">{meta.eyebrow}</p>
				{/if}
				<h1 class="mt-1 text-2xl font-bold tracking-tight text-card-foreground">{meta?.title}</h1>
				{#if meta?.description}
					<p class="mt-2 text-sm text-muted-foreground">{meta.description}</p>
				{/if}
			</header>
		{/if}

		<div class="w-full">
			{@render children()}
		</div>
	</div>

	{#if footer && !hideFooter}
		<div
			class="sticky bottom-0 z-10 flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border bg-card py-4"
		>
			{#if backPath}
				<Button
					variant="outline"
					onclick={() => {
						const path = backPath;
						if (path) void gotoOnboardingStep(path);
					}}
				>
					Back
				</Button>
			{/if}
			{@render footer()}
		</div>
	{/if}
</div>
