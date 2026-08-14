<script lang="ts">
	import { Calendar as CalendarIcon } from '$lib/assets/icons';
	import { Calendar } from '$lib/components/ui/calendar';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { cn } from '$lib/utils';
	import {
		DateFormatter,
		getLocalTimeZone,
		parseDate,
		type DateValue
	} from '@internationalized/date';

	interface Props {
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		onValueChange?: (value: string) => void;
	}

	let {
		value = $bindable(''),
		placeholder = 'Select a date',
		disabled = false,
		class: className,
		onValueChange
	}: Props = $props();

	let open = $state(false);
	let selectedDate = $state<DateValue | undefined>();

	const formatter = new DateFormatter('en-IN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});

	$effect(() => {
		try {
			selectedDate = value ? parseDate(value) : undefined;
		} catch {
			selectedDate = undefined;
		}
	});

	function selectDate(date: DateValue | undefined): void {
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
			placeholder={selectedDate}
			captionLayout="dropdown"
			initialFocus
			onValueChange={selectDate}
		/>
	</PopoverContent>
</Popover>
