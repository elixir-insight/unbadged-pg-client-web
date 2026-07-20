<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: RangeCalendarPrimitive.CellProps = $props();
</script>

<RangeCalendarPrimitive.Cell
	bind:ref
	class={cn(
		'relative size-(--cell-size) p-0 text-center text-sm focus-within:z-20 data-[range-middle]:rounded-e-(--cell-radius) [&:first-child[data-selected]_[data-bits-day]]:rounded-s-(--cell-radius) [&:has([data-range-end])]:rounded-e-(--cell-radius) dark:[&:has([data-range-end])]:hover:bg-accent [&:has([data-range-middle])]:rounded-none [&:has([data-range-middle])]:bg-accent first:[&:has([data-range-middle])]:rounded-s-(--cell-radius) last:[&:has([data-range-middle])]:rounded-e-(--cell-radius) dark:[&:has([data-range-middle])]:hover:bg-accent/50 [&:has([data-range-start])]:rounded-s-(--cell-radius) dark:[&:has([data-range-start])]:hover:bg-accent [&:has([data-selected])]:bg-accent [&:last-child[data-selected]_[data-bits-day]]:rounded-e-(--cell-radius)',
		// Outside-month cells: clear range/selection background and rounding
		'has-data-outside-month:rounded-none! has-data-outside-month:bg-transparent!',
		// hover preview (data-highlighted = between start and hovered date, before end is committed)
		'has-data-highlighted:rounded-none has-data-highlighted:bg-accent/60 first:has-data-highlighted:rounded-s-(--cell-radius) last:has-data-highlighted:rounded-e-(--cell-radius)',
		className
	)}
	{...restProps}
/>
