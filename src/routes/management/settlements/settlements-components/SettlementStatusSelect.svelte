<script lang="ts">
	import type { SettlementStatus } from '$lib/data/partnerSettlementsDummyData';
	import { STATUS_CONFIG } from '$lib/data/partnerSettlementsDummyData';
	import { cn } from '$lib/utils';
	import { Check, ChevronDown } from '$lib/assets/icons';

	let {
		value = $bindable<SettlementStatus>('unsettled'),
		disabled = false,
		placeholder = 'Select status',
		onValueChange
	}: {
		value?: SettlementStatus;
		disabled?: boolean;
		placeholder?: string;
		onValueChange?: (status: SettlementStatus) => void;
	} = $props();

	let open = $state(false);

	const options = $derived(
		(Object.keys(STATUS_CONFIG) as SettlementStatus[]).map((status) => ({
			value: status,
			label: STATUS_CONFIG[status].label
		}))
	);

	const selectedLabel = $derived(
		options.find((option) => option.value === value)?.label ?? placeholder
	);

	function selectStatus(status: SettlementStatus) {
		value = status;
		onValueChange?.(status);
		open = false;
	}

	function clickOutside(node: HTMLElement) {
		function handle(event: MouseEvent) {
			if (!node.contains(event.target as Node)) open = false;
		}

		document.addEventListener('mousedown', handle);
		return () => document.removeEventListener('mousedown', handle);
	}
</script>

<div {@attach clickOutside} class="relative">
	<button
		type="button"
		{disabled}
		class={cn(
			'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm shadow-xs',
			'hover:border-primary/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
			'disabled:cursor-not-allowed disabled:opacity-50',
			!value && 'text-muted-foreground'
		)}
		aria-haspopup="listbox"
		aria-expanded={open}
		onclick={() => {
			if (!disabled) open = !open;
		}}
	>
		<span class="truncate">{selectedLabel}</span>
		<ChevronDown
			class={cn(
				'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
				open && 'rotate-180'
			)}
		/>
	</button>

	{#if open}
		<ul
			role="listbox"
			aria-label="Settlement status"
			class="absolute top-full left-0 z-[100] mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg"
		>
			{#each options as option (option.value)}
				<li>
					<button
						type="button"
						role="option"
						aria-selected={value === option.value}
						class={cn(
							'flex w-full items-center justify-between rounded-sm px-2.5 py-2 text-sm transition-colors',
							'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none',
							value === option.value && 'bg-accent font-medium'
						)}
						onclick={() => selectStatus(option.value)}
					>
						{option.label}
						<Check
							class={cn('size-3.5 shrink-0', value === option.value ? 'opacity-100' : 'opacity-0')}
						/>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
