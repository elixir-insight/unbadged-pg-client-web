<script lang="ts" module>
	export interface SearchWithDropdownOption {
		value: string;
		label: string;
		description?: string;
		disabled?: boolean;
	}

	export interface SearchWithDropdownGroup {
		group: string;
		items: SearchWithDropdownOption[];
	}
</script>

<script lang="ts">
	import { Popover as PopoverPrimitive } from 'bits-ui';
	import { PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { Check, ChevronDown, Search } from '$lib/assets/icons';

	let {
		value = $bindable<string | undefined>(),
		options = [] as (SearchWithDropdownOption | SearchWithDropdownGroup)[],
		placeholder = 'Select…',
		searchPlaceholder = 'Search…',
		emptyMessage = 'No results found.',
		disabled = false,
		size = 'default' as 'sm' | 'default',
		class: className,
		onValueChange
	}: {
		value?: string;
		options?: (SearchWithDropdownOption | SearchWithDropdownGroup)[];
		placeholder?: string;
		searchPlaceholder?: string;
		emptyMessage?: string;
		disabled?: boolean;
		size?: 'sm' | 'default';
		class?: string;
		onValueChange?: (value: string) => void;
	} = $props();

	let open = $state(false);
	let query = $state('');

	function isGroup(
		option: SearchWithDropdownOption | SearchWithDropdownGroup
	): option is SearchWithDropdownGroup {
		return 'group' in option;
	}

	const allFlat = $derived(
		options.flatMap((option) => (isGroup(option) ? option.items : [option]))
	);

	const selectedOption = $derived(allFlat.find((option) => option.value === value));

	const filtered = $derived(
		query.trim() === ''
			? options
			: options.flatMap((option): (SearchWithDropdownOption | SearchWithDropdownGroup)[] => {
					if (isGroup(option)) {
						const items = option.items.filter((item) => matchesQuery(item, query));
						return items.length ? [{ group: option.group, items }] : [];
					}
					return matchesQuery(option, query) ? [option] : [];
				})
	);

	function matchesQuery(option: SearchWithDropdownOption, search: string) {
		const needle = search.toLowerCase();
		return (
			option.label.toLowerCase().includes(needle) ||
			(option.description?.toLowerCase().includes(needle) ?? false)
		);
	}

	function initials(label: string) {
		return label
			.split(' ')
			.map((word) => word[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	function pick(option: SearchWithDropdownOption) {
		if (option.disabled) return;
		value = option.value;
		onValueChange?.(option.value);
		open = false;
		query = '';
	}

	function onOpenChange(isOpen: boolean) {
		if (!isOpen) query = '';
	}
</script>

<PopoverPrimitive.Root bind:open {onOpenChange}>
	<PopoverTrigger
		{disabled}
		data-size={size}
		class={cn(
			'flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none',
			'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer',
			'disabled:cursor-not-allowed disabled:opacity-50',
			'dark:bg-input/30 dark:hover:bg-input/50',
			size === 'sm' ? 'h-8' : 'h-9',
			className
		)}
	>
		<span class={cn('min-w-0 truncate text-left', !selectedOption && 'text-muted-foreground')}>
			{selectedOption?.label ?? placeholder}
		</span>
		<ChevronDown
			class={cn(
				'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
				open && 'rotate-180'
			)}
		/>
	</PopoverTrigger>

	<PopoverContent align="start" sideOffset={4} class="w-(--bits-popover-anchor-width) p-0">
		<div class="flex items-center gap-2 border-b border-border px-2.5 py-2">
			<Search class="size-3.5 shrink-0 text-muted-foreground" />
			<input
				type="text"
				bind:value={query}
				placeholder={searchPlaceholder}
				class="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
			/>
		</div>

		<div class="max-h-60 overflow-y-auto scroll-py-1 py-1">
			{#if filtered.length === 0}
				<p class="px-3 py-4 text-center text-sm text-muted-foreground">{emptyMessage}</p>
			{:else}
				{#each filtered as option, index (isGroup(option) ? `g:${option.group}` : `f:${option.value}`)}
					{#if isGroup(option)}
						{#if index > 0}
							<div class="my-1 border-t border-border"></div>
						{/if}
						<p class="px-2.5 py-1 text-xs font-medium text-muted-foreground">{option.group}</p>
						{#each option.items as item (item.value)}
							{@render optionButton(item)}
						{/each}
					{:else}
						{@render optionButton(option)}
					{/if}
				{/each}
			{/if}
		</div>
	</PopoverContent>
</PopoverPrimitive.Root>

{#snippet optionButton(item: SearchWithDropdownOption)}
	<button
		type="button"
		disabled={item.disabled}
		onclick={() => pick(item)}
		class={cn(
			'flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-sm transition-colors',
			'hover:bg-accent cursor-pointer',
			'disabled:cursor-not-allowed disabled:opacity-50',
			'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
			value === item.value && 'bg-accent'
		)}
	>
		<span
			class="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary"
		>
			{initials(item.label)}
		</span>

		<span class="min-w-0 flex-1">
			<span class="block truncate font-medium text-foreground">{item.label}</span>
			{#if item.description}
				<span class="block truncate text-xs text-muted-foreground">{item.description}</span>
			{/if}
		</span>

		<Check
			class={cn(
				'size-3.5 shrink-0 transition-opacity',
				value === item.value ? 'opacity-100' : 'opacity-0'
			)}
		/>
	</button>
{/snippet}
