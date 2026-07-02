<script lang="ts" module>
	export type SearchVariant = 'bordered' | 'borderless';
</script>

<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { Search } from '$lib/assets/icons';
	import { Input } from '$lib/components/ui/input';

	type SearchProps = WithElementRef<Omit<HTMLInputAttributes, 'type' | 'files'>> & {
		value?: string;
		placeholder?: string;
		/** Controls input visual style. Default: borderless */
		variant?: SearchVariant;
		class?: string;
	};

	let {
		value = $bindable(''),
		placeholder = 'Search…',
		variant = 'borderless',
		class: className = '',
		ref = $bindable(null),
		...restProps
	}: SearchProps = $props();

	const inputClass = $derived(
		variant === 'bordered'
			? 'bg-background border-border hover:border-primary/40 dark:bg-input/30 transition-colors duration-150'
			: 'bg-background border-input shadow-xs'
	);
</script>

<div class={cn('relative flex items-center', className)}>
	<Search class="pointer-events-none absolute left-3 size-4 shrink-0 text-muted-foreground" />
	<Input
		bind:ref
		bind:value
		type="search"
		{placeholder}
		class={cn('pl-9 [&::-webkit-search-cancel-button]:hidden', inputClass)}
		{...restProps}
	/>
</div>
