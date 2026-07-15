<script lang="ts">
	import { Copy, Check } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	let {
		value,
		label = 'Copy',
		class: className,
		stopPropagation = false
	}: {
		value: string;
		label?: string;
		class?: string;
		stopPropagation?: boolean;
	} = $props();

	let copied = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	function handleClick(event: MouseEvent) {
		if (stopPropagation) event.stopPropagation();
		navigator.clipboard.writeText(value);
		copied = true;
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => (copied = false), 1200);
	}
</script>

<button
	type="button"
	onclick={handleClick}
	aria-label="{label}: {value}"
	class={cn(
		'flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:text-foreground',
		className
	)}
>
	{#if copied}
		<Check class="size-3 text-success" />
	{:else}
		<Copy class="size-3" />
	{/if}
</button>
