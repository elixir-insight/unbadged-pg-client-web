<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { Button } from '$lib/components/reusable';
	import { gotoOnboardingStep } from './navigation';
	import { previousStepPath, STEPS, stepIdFromPathname } from './steps';

	let {
		children,
		footer
	}: {
		children: Snippet;
		footer?: Snippet;
	} = $props();

	const currentStep = $derived(stepIdFromPathname(page.url.pathname));
	const meta = $derived(STEPS[currentStep - 1]);
	const backPath = $derived(previousStepPath(currentStep));
</script>

<div class="flex h-full min-h-0 flex-col">
	<header class="shrink-0 border-b border-border">
		<div class="mx-auto w-full max-w-[640px] px-6 py-5">
			<h1 class="text-2xl font-bold tracking-tight text-foreground">{meta.title}</h1>
		</div>
	</header>

	<div class="min-h-0 flex-1 overflow-y-auto">
		<div class="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-6 py-6">
			{@render children()}
		</div>
	</div>

	{#if footer}
		<footer class="shrink-0 border-t border-border">
			<div
				class="mx-auto flex w-full max-w-[640px] flex-wrap items-center justify-end gap-3 px-6 py-4"
			>
				{#if backPath}
					<Button variant="outline" onclick={() => void gotoOnboardingStep(backPath)}>Back</Button>
				{/if}
				{@render footer()}
			</div>
		</footer>
	{/if}
</div>
