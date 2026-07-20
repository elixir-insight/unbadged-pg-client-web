<script module lang="ts">
	export type PipelineStatus = 'healthy' | 'delayed' | 'degraded';

	export interface BankPipelineRow {
		pipelineId: string;
		processedVolume: number;
		successRate: number;
		cbRatioActual: number;
		cbRatioThreshold: number;
		avgTat: number;
		turnaround: string;
		status: PipelineStatus;
	}
</script>

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Chip } from '$lib/components/ui/badge';
	import { Landmark } from '$lib/assets/icons';
	import { cn } from '$lib/utils';

	let {
		title,
		rows,
		formatValue = (v: number) => `${v}`,
		class: className
	}: {
		title: string;
		rows: BankPipelineRow[];
		formatValue?: (value: number) => string;
		class?: string;
	} = $props();

	const STATUS_LABEL: Record<PipelineStatus, string> = {
		healthy: 'Healthy',
		delayed: 'Delayed',
		degraded: 'Degraded'
	};

	const STATUS_VARIANT: Record<PipelineStatus, 'success' | 'warning' | 'error'> = {
		healthy: 'success',
		delayed: 'warning',
		degraded: 'error'
	};
</script>

<Card.Root class={cn('flex h-full min-h-0 flex-col', className)}>
	<Card.Header>
		<Card.Title class="text-sm font-semibold">{title}</Card.Title>
		<Card.Action>
			<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
				<Landmark class="size-3.5" aria-hidden="true" />
				{rows.length} partner banks
			</div>
		</Card.Action>
	</Card.Header>

	<Card.Content class="min-h-0 flex-1 overflow-auto text-xs">
		<Table.Root>
			<Table.Header class="sticky top-0 z-10">
				<Table.Row class="bg-muted/40 hover:bg-muted/40">
					<Table.Head
						class="h-9 py-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
						>Pipeline ID</Table.Head
					>
					<Table.Head
						class="h-9 py-1.5 text-right text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
						>Processed Volume</Table.Head
					>
					<Table.Head
						class="h-9 py-1.5 text-right text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
						>Success Rate</Table.Head
					>
					<Table.Head
						class="h-9 py-1.5 text-right text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
						>CB Ratio (Act/Thres)</Table.Head
					>
					<Table.Head
						class="h-9 py-1.5 text-right text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
						>Avg TAT %</Table.Head
					>
					<Table.Head
						class="h-9 py-1.5 text-right text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
						>Turnaround</Table.Head
					>
					<Table.Head
						class="h-9 py-1.5 text-right text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
						>Status</Table.Head
					>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each rows as row (row.pipelineId)}
					<Table.Row>
						<Table.Cell class="py-2 font-medium text-primary">{row.pipelineId}</Table.Cell>
						<Table.Cell class="py-2 text-right font-medium tabular-nums text-foreground">
							{formatValue(row.processedVolume)}
						</Table.Cell>
						<Table.Cell class="py-2 text-right font-semibold tabular-nums text-foreground">
							{row.successRate.toFixed(1)}%
						</Table.Cell>
						<Table.Cell class="py-2 text-right tabular-nums text-muted-foreground">
							{row.cbRatioActual.toFixed(2)} / {row.cbRatioThreshold.toFixed(2)}
						</Table.Cell>
						<Table.Cell class="py-2 text-right tabular-nums text-muted-foreground">
							{row.avgTat.toFixed(1)}%
						</Table.Cell>
						<Table.Cell class="py-2 text-right tabular-nums text-muted-foreground">
							{row.turnaround}
						</Table.Cell>
						<Table.Cell class="py-2 text-right">
							<Chip variant={STATUS_VARIANT[row.status]} class="ml-auto h-5 text-[11px]">
								{STATUS_LABEL[row.status]}
							</Chip>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</Card.Content>
</Card.Root>
