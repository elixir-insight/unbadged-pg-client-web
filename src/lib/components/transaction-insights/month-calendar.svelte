<script lang="ts">
	import {
		CalendarDate,
		endOfMonth,
		getLocalTimeZone,
		today,
		type DateValue
	} from '@internationalized/date';
	import { Button, Chip } from '$lib/components/reusable';
	import { ChevronLeft, ChevronRight } from '$lib/assets/icons';
	import { cn } from '$lib/utils';
	import type { InsightsDaySummary, InsightsMerchant } from './types';
	import { INSIGHTS_STATUS_LABEL, INSIGHTS_STATUS_VARIANT } from './status';

	interface Props {
		merchant: InsightsMerchant;
		daySummaries: InsightsDaySummary[];
		year: number;
		month: number;
		onMonthChange: (year: number, month: number) => void;
	}

	let { merchant, daySummaries, year, month, onMonthChange }: Props = $props();

	const now = today(getLocalTimeZone());

	const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

	const visibleMonth = $derived(new CalendarDate(year, month, 1));

	const monthLabel = $derived(
		visibleMonth.toDate(getLocalTimeZone()).toLocaleDateString('en-IN', {
			month: 'long',
			year: 'numeric'
		})
	);

	const summaryByDate = $derived(
		new Map(daySummaries.map((summary) => [summary.date, summary] as const))
	);

	const calendarCells = $derived.by(() => {
		const firstOfMonth = visibleMonth;
		const daysInMonth = endOfMonth(firstOfMonth).day;
		// Monday-first: CalendarDate.toDate → getDay() Sunday=0
		const jsWeekday = firstOfMonth.toDate(getLocalTimeZone()).getDay();
		const mondayOffset = (jsWeekday + 6) % 7;

		const cells: Array<{ date: CalendarDate | null; key: string }> = [];

		for (let index = 0; index < mondayOffset; index += 1) {
			cells.push({ date: null, key: `pad-${index}` });
		}

		for (let day = 1; day <= daysInMonth; day += 1) {
			const date = new CalendarDate(year, month, day);
			cells.push({ date, key: date.toString() });
		}

		while (cells.length % 7 !== 0) {
			cells.push({ date: null, key: `trail-${cells.length}` });
		}

		return cells;
	});

	function shiftMonth(delta: number) {
		const next = visibleMonth.add({ months: delta });
		onMonthChange(next.year, next.month);
	}

	function isToday(date: CalendarDate): boolean {
		return date.compare(now) === 0;
	}

	function dayKey(date: DateValue): string {
		return date.toString();
	}

	const currency = new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		maximumFractionDigits: 0
	});
</script>

<div class="space-y-6">
	<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div class="space-y-2">
			<div class="flex flex-wrap items-center gap-2">
				<h1 class="text-2xl font-semibold text-foreground">{merchant.name}</h1>
				<Chip variant={INSIGHTS_STATUS_VARIANT[merchant.status]}>
					{INSIGHTS_STATUS_LABEL[merchant.status]}
				</Chip>
			</div>
			<p class="text-sm text-muted-foreground">Monthly transaction calendar for this merchant.</p>
		</div>

		<div
			class="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-sm"
		>
			<Button
				variant="ghost"
				size="icon"
				class="size-8"
				aria-label="Previous month"
				onclick={() => shiftMonth(-1)}
			>
				<ChevronLeft class="size-4" />
			</Button>
			<span class="min-w-36 px-2 text-center text-sm font-medium text-foreground">
				{monthLabel}
			</span>
			<Button
				variant="ghost"
				size="icon"
				class="size-8"
				aria-label="Next month"
				onclick={() => shiftMonth(1)}
			>
				<ChevronRight class="size-4" />
			</Button>
		</div>
	</header>

	<div class="overflow-hidden rounded-xl border border-border bg-card">
		<div class="grid grid-cols-7 border-b border-border bg-muted/40">
			{#each weekdayLabels as label (label)}
				<div
					class="px-2 py-3 text-center text-xs font-medium tracking-wide text-muted-foreground uppercase"
				>
					{label}
				</div>
			{/each}
		</div>

		<div class="grid grid-cols-7">
			{#each calendarCells as cell (cell.key)}
				{#if cell.date}
					{@const summary = summaryByDate.get(dayKey(cell.date))}
					<div
						class={cn(
							'flex min-h-24 flex-col gap-2 border-r border-b border-border p-2 last:border-r-0',
							isToday(cell.date) && 'bg-muted/30'
						)}
					>
						<span class="text-xs font-medium text-muted-foreground">
							{cell.date.day}
						</span>
						{#if summary}
							<div class="mt-auto space-y-0.5">
								<p class="text-xs font-medium text-foreground">
									{summary.transactionCount} txn
								</p>
								<p class="text-xs text-muted-foreground">
									{currency.format(summary.volume)}
								</p>
							</div>
						{/if}
					</div>
				{:else}
					<div class="min-h-24 border-r border-b border-border bg-muted/10 last:border-r-0"></div>
				{/if}
			{/each}
		</div>
	</div>
</div>
