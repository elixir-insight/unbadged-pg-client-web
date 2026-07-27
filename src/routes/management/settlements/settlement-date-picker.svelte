<script lang="ts">
	// Single-day picker composed from the same primitives as DateRangePicker
	// (Popover + RangeCalendar) — there's no single-date calendar component in
	// the design system yet, so this locks the range picker to one day instead
	// of introducing a new calendar implementation.
	import type { DateValue } from '@internationalized/date';
	import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date';
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/ui/popover';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import { cn } from '$lib/utils';
	import { Calendar, ChevronsUpDown } from '$lib/assets/icons';

	interface Props {
		value?: DateValue;
		placeholder?: string;
		locale?: string;
		maxValue?: DateValue;
		class?: string;
		onChange?: (value: DateValue) => void;
	}

	let {
		value = $bindable(),
		placeholder = 'Select date',
		locale = 'en-IN',
		maxValue,
		class: className,
		onChange
	}: Props = $props();

	let open = $state(false);

	const fmt = $derived(
		new DateFormatter(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
	);
	const displayValue = $derived(value ? fmt.format(value.toDate(getLocalTimeZone())) : null);
	const isToday = $derived(!!value && value.compare(today(getLocalTimeZone())) === 0);
	const isYesterday = $derived(
		!!value && value.compare(today(getLocalTimeZone()).subtract({ days: 1 })) === 0
	);
	const relativeLabel = $derived(isToday ? 'Today' : isYesterday ? 'Yesterday' : null);

	function handleRangeChange(range: { start?: DateValue; end?: DateValue }) {
		if (!range.start) return;
		value = range.start;
		onChange?.(range.start);
		open = false;
	}
</script>

<Popover bind:open>
	<PopoverTrigger
		class={cn(
			'flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 shadow-xs',
			'transition-colors hover:border-primary/40 focus:ring-1 focus:ring-ring/50 focus:outline-none',
			className
		)}
	>
		<Calendar class="size-4 shrink-0 text-muted-foreground" />
		<span
			class={cn('text-sm font-medium', displayValue ? 'text-foreground' : 'text-muted-foreground')}
		>
			{#if displayValue}
				{relativeLabel ? `${relativeLabel} · ${displayValue}` : displayValue}
			{:else}
				{placeholder}
			{/if}
		</span>
		<ChevronsUpDown class="size-3.5 shrink-0 text-muted-foreground" />
	</PopoverTrigger>

	<PopoverContent align="start" sideOffset={4} class="w-auto overflow-hidden p-0">
		<RangeCalendar
			value={{ start: value, end: value }}
			{maxValue}
			{locale}
			numberOfMonths={1}
			onValueChange={handleRangeChange}
		/>
	</PopoverContent>
</Popover>
