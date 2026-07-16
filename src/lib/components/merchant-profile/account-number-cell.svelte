<script lang="ts">
	import { Copy, Check } from '$lib/assets/icons';

	let { value }: { value: string } = $props();

	let copied = $state(false);

	function handleCopy() {
		navigator.clipboard.writeText(value);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<div class="flex items-center gap-1.5">
	<span class="font-mono text-sm text-foreground">{value}</span>
	<button
		type="button"
		onclick={handleCopy}
		aria-label="Copy virtual account number"
		class="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
	>
		{#if copied}
			<Check class="size-3.5 text-primary" />
		{:else}
			<Copy class="size-3.5" />
		{/if}
	</button>
</div>
