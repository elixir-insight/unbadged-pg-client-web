<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { page } from '$app/state';
	import { Button } from '$lib/components/reusable';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { gotoOnboardingStep } from './navigation';
	import { previousStepPath, STEPS, stepIdFromPathname } from './steps';

	let {
		children,
		footer,
		error = ''
	}: {
		children: Snippet;
		footer?: Snippet;
		/** Save/submit failure, shown beside the actions so it is never scrolled out of view. */
		error?: string;
	} = $props();

	const currentStep = $derived(stepIdFromPathname(page.url.pathname));
	const meta = $derived(STEPS[currentStep - 1]);
	const backPath = $derived(previousStepPath(currentStep));

	// A save error routed here from another step (see navigation.ts routeSaveError) — read once at
	// mount, not reactively: the step the error was routed *from* is still mounted at the instant
	// it's set (right before the navigation that unmounts it), so a reactive read there would
	// consume it before this page ever exists to show it.
	let routedError = $state('');
	onMount(() => {
		if (!onboarding.saveError) return;
		routedError = onboarding.consumeSaveError();
	});
	const shownError = $derived(error || routedError);
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
				{#if shownError}
					<p role="alert" class="min-w-0 flex-1 text-sm text-destructive">{shownError}</p>
				{/if}
				{#if backPath}
					<Button variant="outline" onclick={() => void gotoOnboardingStep(backPath)}>Back</Button>
				{/if}
				{@render footer()}
			</div>
		</footer>
	{/if}
</div>
