<script lang="ts">
	import { cn } from '$lib/utils';
	import { Calendar, X } from '$lib/assets/icons';
	import { DateFormatter } from '@internationalized/date';

	let {
		value = $bindable(''),
		label,
		required = false,
		placeholder = 'Pick date',
		disabled = false,
		class: className = ''
	}: {
		value?: string;
		label?: string;
		required?: boolean;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
	} = $props();

	let open = $state(false);

	const displayValue = $derived.by(() => {
		if (!value) return null;
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return null;
		return new DateFormatter('en-IN', { dateStyle: 'medium' }).format(date);
	});

	function clickOutside(node: HTMLElement) {
		function handle(event: MouseEvent) {
			if (!node.contains(event.target as Node)) open = false;
		}
		document.addEventListener('mousedown', handle);
		return () => document.removeEventListener('mousedown', handle);
	}
</script>

<div {@attach clickOutside} class={cn('relative flex flex-col gap-1.5', className)}>
	{#if label}
		<span class="text-sm font-medium text-foreground">
			{label}
			{#if required}<span class="text-destructive"> *</span>{/if}
		</span>
	{/if}

	<div class="relative flex items-center">
		<button
			type="button"
			{disabled}
			onclick={() => {
				if (!disabled) open = !open;
			}}
			class={cn(
				'flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-left text-sm shadow-xs transition-colors',
				'hover:border-primary/40 focus:ring-1 focus:ring-ring/50 focus:outline-none',
				'disabled:cursor-not-allowed disabled:opacity-50',
				displayValue ? 'pr-8' : 'text-muted-foreground'
			)}
		>
			<Calendar class="size-4 shrink-0 text-muted-foreground" />
			<span class="flex-1 truncate">{displayValue ?? placeholder}</span>
		</button>

		{#if displayValue && !disabled}
			<button
				type="button"
				onclick={() => {
					value = '';
					open = false;
				}}
				class="absolute right-2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
				aria-label="Clear date"
			>
				<X class="size-3.5" />
			</button>
		{/if}
	</div>

	{#if open}
		<div
			class="absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-border bg-popover p-2 shadow-md"
		>
			<input
				type="date"
				bind:value
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
				onchange={() => {
					open = false;
				}}
			/>
		</div>
	{/if}
</div>
