<script lang="ts">
	import { cn } from '$lib/utils';
	import { Copy, Check } from '$lib/assets/icons';

	let {
		label,
		value,
		mono = false,
		copyable = false,
		code = false
	}: {
		label: string;
		value: string;
		mono?: boolean;
		copyable?: boolean;
		code?: boolean;
	} = $props();

	let copied = $state(false);

	function handleCopy() {
		navigator.clipboard.writeText(value);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<div class="flex flex-col gap-1.5">
	<span class="text-xs font-medium tracking-wide text-muted-foreground/70 uppercase">{label}</span>
	<div class="flex items-center gap-2">
		{#if code}
			<code
				class="min-w-0 flex-1 truncate rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-foreground"
			>
				{value}
			</code>
		{:else}
			<span class={cn('truncate text-sm font-medium text-foreground', mono && 'font-mono')}>
				{value}
			</span>
		{/if}

		{#if copyable}
			<button
				type="button"
				onclick={handleCopy}
				aria-label="Copy {label}"
				class="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
			>
				{#if copied}
					<Check class="size-3.5 text-primary" />
				{:else}
					<Copy class="size-3.5" />
				{/if}
			</button>
		{/if}
	</div>
</div>
