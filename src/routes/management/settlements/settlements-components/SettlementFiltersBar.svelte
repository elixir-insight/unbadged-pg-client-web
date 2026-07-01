<script lang="ts">
	import { STATUS_FILTER_OPTIONS } from '$lib/data/partnerSettlementsDummyData';
	import type { SettlementStatus } from '$lib/data/partnerSettlementsDummyData';
	import { Chip } from '$lib/components/reusable';
	import SettlementDatePicker from './SettlementDatePicker.svelte';
	import { cn } from '$lib/utils';

	let {
		statusFilter = 'all',
		fromDate = '',
		toDate = '',
		onStatusChange,
		onFromDateChange,
		onToDateChange
	}: {
		statusFilter?: SettlementStatus | 'all';
		fromDate?: string;
		toDate?: string;
		onStatusChange: (status: SettlementStatus | 'all') => void;
		onFromDateChange: (value: string) => void;
		onToDateChange: (value: string) => void;
	} = $props();
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
	<div class="flex flex-wrap items-center gap-2">
		{#each STATUS_FILTER_OPTIONS as option (option.value)}
			<button type="button" onclick={() => onStatusChange(option.value)}>
				<Chip
					variant={statusFilter === option.value ? 'default' : 'outline'}
					class={cn(
						'rounded-full px-3',
						statusFilter === option.value && 'pointer-events-none shadow-xs'
					)}
				>
					{option.label}
				</Chip>
			</button>
		{/each}
	</div>

	<div class="flex flex-wrap items-center gap-3">
		<SettlementDatePicker
			value={fromDate}
			onValueChange={onFromDateChange}
			placeholder="From date"
			class="w-full min-w-[9.5rem] sm:w-40"
		/>
		<SettlementDatePicker
			value={toDate}
			onValueChange={onToDateChange}
			placeholder="To date"
			class="w-full min-w-[9.5rem] sm:w-40"
		/>
	</div>
</div>
