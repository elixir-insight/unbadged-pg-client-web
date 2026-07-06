<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import { ArrowLeft, ArrowRight } from '$lib/assets/icons';
	import type { Snippet } from 'svelte';

	interface Props {
		showPrev?: boolean;
		onprev?: () => void;
		prevLabel?: string;
		onclear?: () => void;
		showClear?: boolean;
		onnext?: () => void;
		nextLabel?: string;
		nextDisabled?: boolean;
		showNextIcon?: boolean;
		actions?: Snippet;
	}

	let {
		showPrev = false,
		onprev,
		prevLabel = 'Previous',
		onclear,
		showClear = false,
		onnext,
		nextLabel = 'Save & continue',
		nextDisabled = false,
		showNextIcon = true,
		actions
	}: Props = $props();
</script>

<div class="flex w-full flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
	{#if showPrev && onprev}
		<Button variant="ghost" size="sm" onclick={onprev}>
			<ArrowLeft class="size-4" />
			{prevLabel}
		</Button>
	{:else}
		<div></div>
	{/if}

	{#if actions}
		{@render actions()}
	{:else}
		<div class="flex items-center gap-2">
			{#if showClear && onclear}
				<Button variant="ghost" size="sm" onclick={onclear} class="hidden sm:inline-flex">
					Clear all
				</Button>
			{/if}
			{#if onnext}
				<Button
					size="sm"
					class="gradient-primary text-primary-foreground"
					onclick={onnext}
					disabled={nextDisabled}
				>
					{nextLabel}
					{#if showNextIcon}
						<ArrowRight class="size-4" />
					{/if}
				</Button>
			{/if}
		</div>
	{/if}
</div>
