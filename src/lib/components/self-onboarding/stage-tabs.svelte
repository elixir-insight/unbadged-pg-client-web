<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button } from '$lib/components/reusable';
	import { LockIcon } from '$lib/assets/icons';

	let {
		children,
		canContinue,
		continueLabel = 'Continue',
		onContinue,
		showBack = false,
		onBack,
		secondaryLabel,
		onSecondary,
		hint
	}: {
		children: Snippet;
		canContinue: boolean;
		continueLabel?: string;
		onContinue: () => void;
		showBack?: boolean;
		onBack?: () => void;
		secondaryLabel?: string;
		onSecondary?: () => void;
		hint?: string;
	} = $props();
</script>

<div class="flex min-h-0 flex-1 flex-col">
	<div class="min-h-0 flex-1 overflow-hidden">
		{@render children()}
	</div>

	<div class="shrink-0 space-y-3 border-t border-border/60 pt-4">
		<div class="flex flex-wrap items-center justify-end gap-3">
			{#if showBack && onBack}
				<Button variant="outline" onclick={onBack}>Back</Button>
			{/if}
			{#if secondaryLabel && onSecondary}
				<Button variant="outline" onclick={onSecondary}>{secondaryLabel}</Button>
			{/if}
			<Button disabled={!canContinue} onclick={onContinue}>{continueLabel}</Button>
		</div>
		{#if hint}
			<p class="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
				<LockIcon class="size-3.5 shrink-0" aria-hidden="true" />
				{hint}
			</p>
		{/if}
	</div>
</div>
