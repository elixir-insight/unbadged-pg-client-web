<script lang="ts">
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import type { DateRange } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { Calendar, X } from '$lib/assets/icons';
	import {
		DateFormatter,
		getLocalTimeZone,
		parseDate,
		today,
		type DateValue
	} from '@internationalized/date';

	let {
		value = $bindable(''),
		label,
		required = false,
		placeholder = 'Pick date',
		disabled = false,
		class: className = '',
		onValueChange
	}: {
		value?: string;
		label?: string;
		required?: boolean;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		onValueChange?: (value: string) => void;
	} = $props();

	let open = $state(false);
	let calendarValue = $state<DateRange>({ start: undefined, end: undefined });
	let calendarPlaceholder = $state<DateValue>(today(getLocalTimeZone()));

	const maxDate = today(getLocalTimeZone());

	const displayValue = $derived.by(() => {
		if (!value) return null;
		try {
			const date = parseDate(value).toDate(getLocalTimeZone());
			const fmt = new DateFormatter('en-IN', { dateStyle: 'medium' });
			return fmt.format(date);
		} catch {
			return null;
		}
	});

	function toRange(dateStr: string): DateRange {
		if (!dateStr) return { start: undefined, end: undefined };
		try {
			const date = parseDate(dateStr);
			return { start: date, end: date };
		} catch {
			return { start: undefined, end: undefined };
		}
	}

	function updateValue(next: string) {
		value = next;
		onValueChange?.(next);
	}

	function openCalendar() {
		if (disabled) return;
		calendarValue = toRange(value);
		calendarPlaceholder = calendarValue.start ?? today(getLocalTimeZone());
		open = true;
	}

	function handleCalendarChange(next: DateRange) {
		if (!next.start) return;

		updateValue(next.start.toString());
		calendarValue = { start: next.start, end: next.start };
		open = false;
	}

	function clearDate() {
		updateValue('');
		calendarValue = { start: undefined, end: undefined };
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

<div {@attach clickOutside} class={cn('relative flex flex-col gap-1.5', className)}>
	{#if label}
		<span class="text-sm font-medium text-foreground">
			{label}
			{#if required}<span class="text-destructive">*</span>{/if}
		</span>
	{/if}

	<div class="relative flex items-center">
		<button
			type="button"
			{disabled}
			class={cn(
				'flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-left text-sm shadow-xs transition-colors',
				'hover:border-primary/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
				'disabled:cursor-not-allowed disabled:opacity-50',
				displayValue ? 'pr-8' : '',
				!displayValue && 'text-muted-foreground'
			)}
			aria-haspopup="dialog"
			aria-expanded={open}
			onclick={openCalendar}
		>
			<Calendar class="size-4 shrink-0 text-muted-foreground" />
			<span class="flex-1 truncate">{displayValue ?? placeholder}</span>
		</button>

		{#if displayValue && !disabled}
			<button
				type="button"
				onclick={clearDate}
				class="absolute right-2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
				aria-label="Clear date"
			>
				<X class="size-3.5" />
			</button>
		{/if}
	</div>

	{#if open}
		<div
			class="absolute top-full left-0 z-[100] mt-1 rounded-lg border border-border bg-popover p-1 shadow-lg"
			onmousedown={(event) => event.stopPropagation()}
		>
			<RangeCalendar
				bind:value={calendarValue}
				bind:placeholder={calendarPlaceholder}
				maxValue={maxDate}
				captionLayout="dropdown"
				locale="en-IN"
				onValueChange={handleCalendarChange}
			/>
		</div>
	{/if}
</div>
