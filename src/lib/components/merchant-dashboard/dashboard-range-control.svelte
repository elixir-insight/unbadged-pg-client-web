<script lang="ts">
	import { cn } from '$lib/utils';
	import type { DashboardRange } from './dashboard-data';

	interface Props {
		range: Exclude<DashboardRange, 'custom'>;
		onRangeChange: (range: Exclude<DashboardRange, 'custom'>) => void;
	}

	let { range, onRangeChange }: Props = $props();
</script>

<div class="flex flex-wrap items-center justify-end gap-2">
	<div
		role="group"
		aria-label="Dashboard date range"
		class="flex items-center rounded-md border border-border bg-card p-0.5 shadow-xs"
	>
		{#each [{ value: 'today', label: 'Today' }, { value: '7d', label: '7D' }, { value: '30d', label: '30D' }] as option (option.value)}
			<button
				type="button"
				aria-pressed={range === option.value}
				onclick={() => onRangeChange(option.value as Exclude<DashboardRange, 'custom'>)}
				class={cn(
					'rounded-sm px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
					range === option.value
						? 'bg-primary text-primary-foreground shadow-xs'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground'
				)}
			>
				{option.label}
			</button>
		{/each}
	</div>
</div>
