<script lang="ts">
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import { cn } from '$lib/utils';
	import type { DateRange } from 'bits-ui';
	import { DateFormatter, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { Calendar, X } from '$lib/assets/icons';

	interface Props {
		value?: DateRange;
		label?: string;
		placeholder?: string;
		minValue?: DateValue;
		maxValue?: DateValue;
		locale?: string;
		numberOfMonths?: 1 | 2;
		disabled?: boolean;
		readonly?: boolean;
		class?: string;
		onValueChange?: (value: DateRange) => void;
	}

	let {
		value = $bindable({ start: undefined, end: undefined }),
		label,
		placeholder = 'Select date range',
		minValue,
		maxValue,
		locale = 'en-US',
		numberOfMonths = 1,
		disabled = false,
		readonly = false,
		class: className,
		onValueChange
	}: Props = $props();

	let open = $state(false);

	const displayValue = $derived.by(() => {
		const fmt = new DateFormatter(locale, { dateStyle: 'medium' });
		const start = value?.start;
		const end = value?.end;
		if (start && end)
			return `${fmt.format(start.toDate(getLocalTimeZone()))} – ${fmt.format(end.toDate(getLocalTimeZone()))}`;
		if (start) return `${fmt.format(start.toDate(getLocalTimeZone()))} – …`;
		return null;
	});

	const calendarPlaceholder = $derived(value?.start ?? today(getLocalTimeZone()));

	function clickOutside(node: HTMLElement) {
		function handle(e: MouseEvent) {
			if (!node.contains(e.target as Node)) {
				open = false;
			}
		}
		document.addEventListener('mousedown', handle);
		return () => document.removeEventListener('mousedown', handle);
	}
</script>

<div {@attach clickOutside} class={cn('relative flex flex-col gap-1.5', className)}>
	{#if label}
		<span class="text-sm font-medium text-foreground">{label}</span>
	{/if}

	<div class="relative flex items-center">
		<button
			type="button"
			{disabled}
			onclick={() => {
				if (!disabled && !readonly) open = !open;
			}}
			class={cn(
				'flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-left text-sm shadow-xs transition-colors',
				'hover:border-primary/40 focus:ring-1 focus:ring-ring/50 focus:outline-none',
				'disabled:cursor-not-allowed disabled:opacity-50',
				displayValue ? 'pr-8' : '',
				!displayValue && 'text-muted-foreground'
			)}
		>
			<Calendar class="size-4 shrink-0 text-muted-foreground w-(--bits-popover-anchor-width)" />
			<span class="flex-1 truncate">{displayValue ?? placeholder}</span>
		</button>
		{#if displayValue && !disabled && !readonly}
			<button
				type="button"
				onclick={() => {
					value = { start: undefined, end: undefined };
					open = false;
				}}
				class="absolute right-2 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
				aria-label="Clear date range"
			>
				<X class="size-3.5" />
			</button>
		{/if}
	</div>

	{#if open}
		<div
			class="glass-dropdown-content absolute top-full left-0 z-50 mt-1 rounded-lg border border-white/40 p-1 shadow-lg dark:border-white/10"
		>
			<RangeCalendar
				bind:value
				placeholder={calendarPlaceholder}
				{locale}
				{numberOfMonths}
				{disabled}
				{readonly}
				{minValue}
				{maxValue}
				captionLayout="dropdown"
				onValueChange={(v) => {
					onValueChange?.(v);
					if (v.start && v.end) open = false;
				}}
			/>
		</div>
	{/if}
</div>
