<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AlertCircle } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	let {
		remark = '',
		fieldKey = '',
		highlighted = false,
		instruction = '',
		children
	}: {
		remark?: string;
		fieldKey?: string;
		highlighted?: boolean;
		/** What the applicant should do about the remark, shown under it. */
		instruction?: string;
		children: Snippet;
	} = $props();

	const show = $derived(remark.trim().length > 0);
</script>

<div
	data-remark-field={fieldKey || undefined}
	class={cn(
		'min-w-0',
		(show || highlighted) && 'rounded-lg ring-2 ring-warning/40 ring-offset-2 ring-offset-card'
	)}
>
	{#if show}
		<p class="mb-2 flex items-start gap-1.5 px-1 text-xs text-warning">
			<AlertCircle class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
			<span class="min-w-0">
				<span class="block font-semibold">Management Remark</span>
				<span class="block">{remark}</span>
				{#if instruction}
					<span class="block text-muted-foreground">{instruction}</span>
				{/if}
			</span>
		</p>
	{/if}
	{@render children()}
</div>
