<script lang="ts" module>
	export type MultiSelectOption = { value: string; label: string; disabled?: boolean };
</script>

<script lang="ts">
	import { Popover as PopoverPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { ChevronDown, X } from '$lib/assets/icons';
	import { PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Checkbox } from '$lib/components/ui/checkbox';

	let {
		value = $bindable<string[]>([]),
		options = [] as MultiSelectOption[],
		placeholder = 'Select options…',
		disabled = false,
		class: className
	}: {
		value?: string[];
		options: MultiSelectOption[];
		placeholder: string;
		disabled?: boolean;
		class?: string;
	} = $props();

	let open = $state(false);

	function toggle(val: string) {
		if (value.includes(val)) {
			value = value.filter((v) => v !== val);
		} else {
			value = [...value, val];
		}
	}

	function remove(val: string, e: MouseEvent) {
		e.stopPropagation();
		value = value.filter((v) => v !== val);
	}
</script>

<PopoverPrimitive.Root bind:open>
	<PopoverTrigger
		{disabled}
		class={cn(
			'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors',
			'border-border dark:border-border/40 dark:bg-card/5',
			'glass-dropdown-trigger cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
			disabled && 'cursor-not-allowed opacity-50',
			className
		)}
	>
		{#if value.length === 0}
			<span class="text-muted-foreground select-none">{placeholder}</span>
		{:else}
			{#each value as v (v)}
				{@const label = options.find((o) => o.value === v)?.label ?? v}
				<span
					class="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium dark:border-border dark:bg-muted"
				>
					{label}
					<button
						type="button"
						onclick={(e) => remove(v, e)}
						class="ml-0.5 rounded-sm opacity-60 hover:opacity-100 focus-visible:outline-none"
						aria-label="Remove {label}"
					>
						<X class="size-3" />
					</button>
				</span>
			{/each}
		{/if}
		<ChevronDown
			class={cn(
				'ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200',
				open && 'rotate-180'
			)}
		/>
	</PopoverTrigger>

	<PopoverContent align="start" sideOffset={6} class="w-(--bits-popover-anchor-width) p-1">
		<ul role="listbox" aria-multiselectable="true" class="flex flex-col gap-0.5">
			{#each options as opt (opt.value)}
				<li role="option" aria-selected={value.includes(opt.value)} aria-disabled={opt.disabled}>
					<button
						type="button"
						disabled={opt.disabled}
						onclick={() => toggle(opt.value)}
						class={cn(
							'flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-sm transition-colors',
							'cursor-pointer hover:bg-accent ',
							'disabled:cursor-not-allowed disabled:opacity-50',
							'focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none'
						)}
					>
						{opt.label}
						<Checkbox
							checked={value.includes(opt.value)}
							disabled={opt.disabled}
							tabindex={-1}
							aria-hidden={true}
							class="pointer-events-none"
						/>
					</button>
				</li>
			{/each}
		</ul>
	</PopoverContent>
</PopoverPrimitive.Root>
