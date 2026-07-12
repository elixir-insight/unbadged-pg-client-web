<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowRight } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	interface Props {
		nextSettlementAmount: string;
		nextSettlementTime: string;
		lastSettlementAmount: string;
		lastSettlementTime: string;
		class?: string;
	}

	let {
		nextSettlementAmount,
		nextSettlementTime,
		lastSettlementAmount,
		lastSettlementTime,
		class: className
	}: Props = $props();
</script>

<div
	class={cn(
		'flex h-full flex-col rounded-lg border border-border bg-background p-3 shadow-xs md:p-4',
		className
	)}
>
	<div class="flex items-center justify-between">
		<p class="text-sm font-semibold">Settlement insights</p>
		<a
			href={resolve('/merchant/settlements')}
			class="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
		>
			View all
			<ArrowRight class="size-3" />
		</a>
	</div>

	<div class="mt-2 grid flex-1 grid-cols-2 gap-3">
		<div
			class="flex h-full min-w-0 flex-col justify-between rounded-lg border border-border p-3 md:p-4 bg-blue-50/30"
		>
			<p class="text-xs font-medium tracking-wide text-muted-foreground">Next settlement</p>
			<p class="truncate text-md font-bold tracking-tight">{nextSettlementAmount}</p>
			<p class="truncate text-[10px] text-muted-foreground">{nextSettlementTime}</p>
		</div>
		<div
			class="flex h-full min-w-0 flex-col justify-between rounded-lg border border-border p-3 md:p-4 bg-blue-50/30"
		>
			<p class="text-xs font-medium tracking-wide text-muted-foreground">Last settled</p>
			<p class="truncate text-md font-bold tracking-tight">{lastSettlementAmount}</p>
			<p class="truncate text-[10px] text-muted-foreground">{lastSettlementTime}</p>
		</div>
	</div>
</div>
