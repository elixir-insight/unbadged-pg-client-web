<script lang="ts">
	import { Calendar as CalendarIcon } from '$lib/assets/icons';
	import { Calendar } from '$lib/components/ui/calendar';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import {
		DateFormatter,
		getLocalTimeZone,
		parseDate,
		today,
		type DateValue
	} from '@internationalized/date';

	interface Props {
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		minValue?: DateValue;
		maxValue?: DateValue;
		onValueChange?: (value: string) => void;
	}

	let {
		value = $bindable(''),
		placeholder = 'Select a date',
		disabled = false,
		class: className,
		minValue,
		maxValue,
		onValueChange
	}: Props = $props();

	let open = $state(false);
	let selectedDate = $state<DateValue | undefined>();
	let calendarPlaceholder = $state<DateValue>(today(getLocalTimeZone()));

	const formatter = new DateFormatter('en-IN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});

	const monthOptions = $derived.by(() => {
		const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
		if (!minValue) return allMonths;
		if (calendarPlaceholder.year > minValue.year) return allMonths;
		return allMonths.filter((month) => month >= minValue.month);
	});

	$effect(() => {
		try {
			selectedDate = value ? parseDate(value) : undefined;
		} catch {
			selectedDate = undefined;
		}
	});

	$effect(() => {
		if (selectedDate) calendarPlaceholder = selectedDate;
		else if (minValue) calendarPlaceholder = minValue;
	});

	function selectDate(date: DateValue | undefined): void {
		if (date && minValue && date.compare(minValue) < 0) return;
		selectedDate = date;
		value = date?.toString() ?? '';
		onValueChange?.(value);
		if (date) open = false;
	}
</script>

<Popover bind:open>
	<PopoverTrigger
		{disabled}
		aria-label="Choose date"
		class={cn(
			'flex h-9 w-full items-center justify-start gap-2 rounded-md border border-input bg-background px-3 text-left text-sm font-normal shadow-xs transition-[color,box-shadow] outline-none',
			'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
			'disabled:pointer-events-none disabled:opacity-50',
			!selectedDate && 'text-muted-foreground',
			className
		)}
	>
		<CalendarIcon class="size-4 shrink-0 text-muted-foreground" />
		{selectedDate ? formatter.format(selectedDate.toDate(getLocalTimeZone())) : placeholder}
	</PopoverTrigger>

	<PopoverContent align="start" class="w-auto p-0">
		<Calendar
			type="single"
			value={selectedDate}
			bind:placeholder={calendarPlaceholder}
			captionLayout="dropdown"
			{minValue}
			{maxValue}
			months={monthOptions}
			disableDaysOutsideMonth
			initialFocus
			onValueChange={selectDate}
		/>
	</PopoverContent>
</Popover>
