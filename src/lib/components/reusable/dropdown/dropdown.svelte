<script lang="ts">
	import { Select as SelectPrimitive, Popover as PopoverPrimitive } from 'bits-ui';
	import {
		SelectContent,
		SelectGroup,
		SelectGroupHeading,
		SelectItem,
		SelectSeparator,
		SelectTrigger
	} from '$lib/components/ui/select';
	import { PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import { Check, ChevronDown, Search } from '$lib/assets/icons';

	export type DropdownOption = { value: string; label: string; disabled?: boolean };
	export type DropdownGroup = { group: string; items: DropdownOption[] };

	let {
		value = $bindable<string | undefined>(),
		options = [] as (DropdownOption | DropdownGroup)[],
		placeholder = 'Select an option',
		disabled = false,
		size = 'default' as 'sm' | 'default',
		class: className,
		onValueChange,
		name,
		required,
		ariaLabel,
		bordered = false,
		search = false
	}: {
		value?: string;
		options?: (DropdownOption | DropdownGroup)[];
		placeholder?: string;
		disabled?: boolean;
		size?: 'sm' | 'default';
		class?: string;
		onValueChange?: (value: string) => void;
		name?: string;
		required?: boolean;
		ariaLabel?: string;
		bordered?: boolean;
		search?: boolean;
	} = $props();

	function isGroup(opt: DropdownOption | DropdownGroup): opt is DropdownGroup {
		return 'group' in opt;
	}

	// search mode state
	let open = $state(false);
	let query = $state('');

	const allFlat: DropdownOption[] = $derived(options.flatMap((o) => (isGroup(o) ? o.items : [o])));

	const selectedLabel = $derived(allFlat.find((o) => o.value === value)?.label ?? '');

	const filtered = $derived(
		query.trim() === ''
			? options
			: options.flatMap((o): (DropdownOption | DropdownGroup)[] => {
					if (isGroup(o)) {
						const items = o.items.filter((i) =>
							i.label.toLowerCase().includes(query.toLowerCase())
						);
						return items.length ? [{ group: o.group, items }] : [];
					}
					return o.label.toLowerCase().includes(query.toLowerCase()) ? [o] : [];
				})
	);

	function pick(opt: DropdownOption) {
		if (opt.disabled) return;
		value = opt.value;
		onValueChange?.(opt.value);
		open = false;
		query = '';
	}

	function onOpenChange(isOpen: boolean) {
		if (!isOpen) query = '';
	}
</script>

{#if search}
	<PopoverPrimitive.Root bind:open {onOpenChange}>
		<PopoverTrigger
			{disabled}
			aria-label={ariaLabel}
			data-size={size}
			class={cn(
				'flex w-full items-center justify-between gap-1.5 rounded-md border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none',
				'cursor-pointer focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
				'disabled:cursor-not-allowed disabled:opacity-50',
				'dark:bg-input/30 dark:hover:bg-input/50',
				size === 'sm' ? 'h-8' : 'h-10',
				bordered && 'border-border',
				className
			)}
		>
			<span class={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
				{selectedLabel || placeholder}
			</span>
			<ChevronDown
				class={cn(
					'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
					open && 'rotate-180'
				)}
			/>
		</PopoverTrigger>

		<PopoverContent
			align="start"
			sideOffset={4}
			class="w-max max-w-80 min-w-(--bits-popover-anchor-width) p-0"
		>
			<!-- Search input -->
			<div class="flex items-center gap-2 border-b border-border px-2.5 py-2">
				<Search class="size-3.5 shrink-0 text-muted-foreground" />
				<input
					type="text"
					bind:value={query}
					placeholder="Search"
					class="w-full bg-transparent text-left text-sm outline-none placeholder:text-muted-foreground"
				/>
			</div>

			<!-- Filtered options -->
			<div class="max-h-60 scroll-py-1 overflow-y-auto py-1">
				{#if filtered.length === 0}
					<p class="px-3 py-4 text-left text-sm text-muted-foreground">No results found.</p>
				{:else}
					{#each filtered as opt, i (isGroup(opt) ? `g:${opt.group}` : `f:${(opt as DropdownOption).value}`)}
						{#if isGroup(opt)}
							{#if i > 0}
								<div class="my-1 border-t border-border"></div>
							{/if}
							<p class="px-2.5 py-1 text-left text-xs font-medium text-muted-foreground">
								{opt.group}
							</p>
							{#each opt.items as item (item.value)}
								<button
									type="button"
									disabled={item.disabled}
									onclick={() => pick(item)}
									class={cn(
										'flex w-full items-start gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm transition-colors',
										'cursor-pointer hover:bg-accent',
										'disabled:cursor-not-allowed disabled:opacity-50',
										'focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
										value === item.value && 'bg-accent font-medium'
									)}
								>
									<span class="min-w-0 flex-1 text-left leading-snug">{item.label}</span>
									<Check
										class={cn(
											'mt-0.5 size-3.5 shrink-0 transition-opacity',
											value === item.value ? 'opacity-100' : 'opacity-0'
										)}
									/>
								</button>
							{/each}
						{:else}
							{@const flat = opt as DropdownOption}
							<button
								type="button"
								disabled={flat.disabled}
								onclick={() => pick(flat)}
								class={cn(
									'flex w-full items-start gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm transition-colors',
									'cursor-pointer hover:bg-accent',
									'disabled:cursor-not-allowed disabled:opacity-50',
									'focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
									value === flat.value && 'bg-accent font-medium'
								)}
							>
								<span class="min-w-0 flex-1 text-left leading-snug">{flat.label}</span>
								<Check
									class={cn(
										'mt-0.5 size-3.5 shrink-0 transition-opacity',
										value === flat.value ? 'opacity-100' : 'opacity-0'
									)}
								/>
							</button>
						{/if}
					{/each}
				{/if}
			</div>
		</PopoverContent>
	</PopoverPrimitive.Root>
{:else}
	<!-- Standard select (no search) -->
	<SelectPrimitive.Root type="single" bind:value {disabled} {onValueChange} {name} {required}>
		<SelectTrigger
			{size}
			aria-label={ariaLabel}
			class={cn('w-full', bordered && 'border-border', className)}
		>
			<span class={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
				{selectedLabel || placeholder}
			</span>
		</SelectTrigger>
		<SelectContent>
			{#each options as opt, i (isGroup(opt) ? `g:${opt.group}` : `f:${(opt as DropdownOption).value}`)}
				{#if isGroup(opt)}
					{#if i > 0}
						<SelectSeparator />
					{/if}
					<SelectGroup>
						<SelectGroupHeading>{opt.group}</SelectGroupHeading>
						{#each opt.items as item (item.value)}
							<SelectItem value={item.value} label={item.label} disabled={item.disabled} />
						{/each}
					</SelectGroup>
				{:else}
					{@const flat = opt as DropdownOption}
					<SelectItem value={flat.value} label={flat.label} disabled={flat.disabled} />
				{/if}
			{/each}
		</SelectContent>
	</SelectPrimitive.Root>
{/if}
