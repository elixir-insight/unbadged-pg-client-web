<script lang="ts">
	import { LockIcon } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	let {
		title = 'Access restricted',
		description = "You don't have permission to view this section.",
		moduleLabel,
		class: className
	}: {
		title?: string;
		description?: string;
		/** Optional human-readable module name, e.g. "Payins", shown in a secondary line. */
		moduleLabel?: string;
		class?: string;
	} = $props();
</script>

<div
	class={cn(
		'flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-16 text-center shadow-sm',
		className
	)}
>
	<div class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
		<LockIcon class="size-5" />
	</div>

	<div class="max-w-sm">
		<h3 class="text-sm font-semibold text-foreground">{title}</h3>
		<p class="mt-1 text-sm text-muted-foreground">{description}</p>
		{#if moduleLabel}
			<p class="mt-3 text-xs text-muted-foreground">
				Ask an administrator to grant you access to <span class="font-medium text-foreground"
					>{moduleLabel}</span
				>.
			</p>
		{/if}
	</div>
</div>
