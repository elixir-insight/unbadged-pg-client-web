<script lang="ts" module>
	export type Preset = '7d' | '15d' | '30d' | '90d';

	const PRESETS: { label: string; value: Preset; days: number }[] = [
		{ label: 'Past 7 Days', value: '7d', days: 7 },
		{ label: 'Past 15 Days', value: '15d', days: 15 },
		{ label: 'Past 30 Days', value: '30d', days: 30 },
		{ label: 'Past 90 Days', value: '90d', days: 90 }
	];
</script>

<script lang="ts">
	import type { DateRange } from 'bits-ui';
	import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date';
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/ui/popover';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { Calendar, ChevronsUpDown } from '$lib/assets/icons';

	interface Props {
		value?: DateRange;
		locale?: string;
		class?: string;
		onApply?: (value: DateRange, preset: Preset | null) => void;
	}

	let {
		value = $bindable({ start: undefined, end: undefined }),
		locale = 'en-IN',
		class: className,
		onApply
	}: Props = $props();

	let open = $state(false);
	let tempRange = $state<DateRange>({ start: undefined, end: undefined });

	// Derived from tempRange so preset highlight auto-clears when user picks custom dates
	const tempPreset = $derived(detectPreset(tempRange));

	const fmt = $derived(
		new DateFormatter(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
	);

	function rangeToDisplay(r: DateRange | undefined): string | null {
		if (!r?.start || !r?.end) return null;
		const tz = getLocalTimeZone();
		return `${fmt.format(r.start.toDate(tz))} – ${fmt.format(r.end.toDate(tz))}`;
	}

	function detectPreset(r: DateRange | undefined): Preset | null {
		if (!r?.start || !r?.end) return null;
		const tz = getLocalTimeZone();
		const todayDate = today(tz);
		const endMs = r.end.toDate(tz).getTime();
		const todayMs = todayDate.toDate(tz).getTime();
		if (Math.abs(endMs - todayMs) > 86_400_000) return null;
		const startMs = r.start.toDate(tz).getTime();
		const days = Math.round((todayMs - startMs) / 86_400_000) + 1;
		return PRESETS.find((p) => p.days === days)?.value ?? null;
	}

	function computePresetRange(days: number): DateRange {
		const tz = getLocalTimeZone();
		const end = today(tz);
		const start = end.subtract({ days: days - 1 });
		return { start, end };
	}

	const committedDisplay = $derived(rangeToDisplay(value));
	const presetLabel = $derived(
		PRESETS.find((p) => p.value === detectPreset(value))?.label ?? 'Date range'
	);

	function handleOpenChange(isOpen: boolean) {
		if (isOpen) {
			tempRange = { start: value?.start, end: value?.end };
		}
	}

	function selectPreset(p: (typeof PRESETS)[0]) {
		tempRange = computePresetRange(p.days);
	}

	function apply() {
		value = { start: tempRange.start, end: tempRange.end };
		onApply?.(value, tempPreset);
		open = false;
	}

	function cancel() {
		open = false;
	}
</script>

<Popover bind:open onOpenChange={handleOpenChange}>
	<PopoverTrigger
		class={cn(
			'flex h-9 cursor-pointer items-center rounded-md border border-input bg-background shadow-xs',
			'transition-colors hover:border-primary/40 focus:ring-1 focus:ring-ring/50 focus:outline-none',
			className
		)}
	>
		<!-- Left zone: icon + preset label + sort chevron -->
		<div class="flex items-center gap-1.5 px-3">
			<Calendar class="size-4 shrink-0 text-muted-foreground" />
			<span
				class={cn(
					'text-sm font-medium',
					committedDisplay ? 'text-foreground' : 'text-muted-foreground'
				)}
			>
				{presetLabel}
			</span>
			<ChevronsUpDown class="size-3.5 shrink-0 text-muted-foreground" />
		</div>

		<!-- Vertical divider -->
		<div class="my-1.5 w-px self-stretch bg-border"></div>

		<!-- Right zone: formatted date range or placeholder -->
		<div class={cn('px-3 text-sm', committedDisplay ? 'text-foreground' : 'text-muted-foreground')}>
			{committedDisplay ?? 'DD/MM/YYYY – DD/MM/YYYY'}
		</div>
	</PopoverTrigger>

	<PopoverContent align="start" sideOffset={4} class="w-auto overflow-hidden p-0">
		<!-- Two-panel body -->
		<div class="flex">
			<!-- Left panel: preset list -->
			<div class="flex w-44 shrink-0 flex-col border-r border-border py-1">
				{#each PRESETS as preset (preset.value)}
					<button
						type="button"
						onclick={() => selectPreset(preset)}
						class={cn(
							'w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent',
							tempPreset === preset.value
								? 'bg-accent font-medium text-accent-foreground'
								: 'text-foreground'
						)}
					>
						{preset.label}
					</button>
				{/each}
			</div>

			<!-- Right panel: two-month calendar -->
			<div class="p-3">
				<RangeCalendar
					bind:value={tempRange}
					numberOfMonths={2}
					{locale}
					disableDaysOutsideMonth={true}
				/>
			</div>
		</div>

		<!-- Footer: Cancel + Apply -->
		<div class="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
			<Button variant="outline" size="sm" onclick={cancel}>Cancel</Button>
			<Button size="sm" onclick={apply}>Apply</Button>
		</div>
	</PopoverContent>
</Popover>
