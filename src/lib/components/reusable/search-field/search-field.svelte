<script lang="ts" module>
	export interface SearchFieldOption {
		value: string;
		label: string;
		placeholder?: string;
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import { Search, ChevronsUpDown, Check, X } from '$lib/assets/icons';
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/ui/popover';

	interface Props {
		fields?: SearchFieldOption[];
		field?: string;
		value?: string;
		class?: string;
		onSearch?: (field: string, value: string) => void;
	}

	let {
		fields = [],
		field = $bindable(fields[0]?.value ?? ''),
		value = $bindable(''),
		class: className,
		onSearch
	}: Props = $props();

	let open = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	const selectedField = $derived(fields.find((f) => f.value === field) ?? fields[0]);
	const currentPlaceholder = $derived(
		selectedField?.placeholder ?? `Search by ${selectedField?.label ?? 'value'}…`
	);

	function selectField(f: SearchFieldOption) {
		field = f.value;
		value = '';
		open = false;
		onSearch?.(f.value, '');
		setTimeout(() => inputEl?.focus(), 0);
	}

	function clearValue() {
		value = '';
		onSearch?.(field, '');
		inputEl?.focus();
	}
</script>

<div
	class={cn(
		'flex h-9 items-center overflow-hidden rounded-md border border-input bg-background shadow-xs',
		'transition-colors focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-ring/50 hover:border-primary/40',
		className
	)}
>
	<!-- Left zone: search icon + input -->
	<Search class="ml-3 size-4 shrink-0 text-muted-foreground" />

	<input
		bind:this={inputEl}
		bind:value
		type="text"
		placeholder={currentPlaceholder}
		oninput={() => onSearch?.(field, value)}
		class="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
	/>

	{#if value}
		<button
			type="button"
			onclick={clearValue}
			aria-label="Clear search"
			class="cursor-pointer rounded-sm text-muted-foreground opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none"
		>
			<X class="size-3.5" />
		</button>
	{/if}

	<!-- Vertical divider -->
	<div class="my-1.5 w-px self-stretch bg-border"></div>

	<!-- Right zone: field selector -->
	<Popover bind:open>
		<PopoverTrigger
			class="flex h-full cursor-pointer items-center gap-1.5 px-3 focus-visible:outline-none"
		>
			<span class="text-sm whitespace-nowrap text-muted-foreground">
				in <span class="font-medium text-foreground">{selectedField?.label ?? 'All'}</span>
			</span>
			<ChevronsUpDown class="size-3.5 shrink-0 text-muted-foreground" />
		</PopoverTrigger>

		<PopoverContent align="end" sideOffset={4} class="w-44 gap-0 p-1">
			{#each fields as f (f.value)}
				<button
					type="button"
					onclick={() => selectField(f)}
					class={cn(
						'flex w-full cursor-pointer items-center justify-between rounded-sm px-2.5 py-1.5 text-sm transition-colors',
						'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
						field === f.value && 'bg-accent font-medium'
					)}
				>
					{f.label}
					<Check class={cn('size-3.5 shrink-0', field === f.value ? 'opacity-100' : 'opacity-0')} />
				</button>
			{/each}
		</PopoverContent>
	</Popover>
</div>
