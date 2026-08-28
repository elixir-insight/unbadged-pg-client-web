<script lang="ts">
	import { createRawSnippet } from 'svelte';
	import type { ColumnDef } from '@tanstack/table-core';
	import { Chip, Table } from '$lib/components/reusable';
	import { renderComponent } from '$lib/components/ui/data-table';
	import type { BadgeVariant } from '$lib/components/ui/badge';

	const CHARGEBACK_RATIO_WARNING_THRESHOLD = 0.7;

	function parseChargebackRatio(value: string): number {
		return Number.parseFloat(value);
	}

	function chargebackRatioChipVariant(value: string): BadgeVariant {
		const ratio = parseChargebackRatio(value);
		if (!Number.isFinite(ratio)) return 'secondary';
		return ratio > CHARGEBACK_RATIO_WARNING_THRESHOLD ? 'warning' : 'success';
	}

	type ChargebackRow = {
		orgId: string;
		overallAmount: string;
		principalAmount: string;
		chargebackRatio: string;
	} & Record<string, unknown>;

	const rows: ChargebackRow[] = [
		{
			orgId: 'ORG_2bV',
			overallAmount: '₹ 48,23,012',
			principalAmount: '₹ 3,12,450',
			chargebackRatio: '0.48%'
		},
		{
			orgId: 'ORG_2bj',
			overallAmount: '₹ 1,25,40,800',
			principalAmount: '₹ 1,84,200',
			chargebackRatio: '0.47%'
		},
		{
			orgId: 'ORG_2bn',
			overallAmount: '₹ 76,10,550',
			principalAmount: '₹ 95,000',
			chargebackRatio: '0.25%'
		},
		{
			orgId: 'ORG_2bm',
			overallAmount: '₹ 32,45,900',
			principalAmount: '₹ 48,750',
			chargebackRatio: '0.50%'
		},
		{
			orgId: 'ORG_2bY',
			overallAmount: '₹ 2,10,00,000',
			principalAmount: '₹ 4,20,000',
			chargebackRatio: '0.80%'
		},
		{
			orgId: 'ORG_2cA',
			overallAmount: '₹ 18,75,430',
			principalAmount: '₹ 12,400',
			chargebackRatio: '0.66%'
		},
		{
			orgId: 'ORG_2cK',
			overallAmount: '₹ 91,20,000',
			principalAmount: '₹ 2,73,600',
			chargebackRatio: '0.80%'
		},
		{
			orgId: 'ORG_2dP',
			overallAmount: '₹ 54,80,220',
			principalAmount: '₹ 21,920',
			chargebackRatio: '0.40%'
		}
	];

	const columns: ColumnDef<ChargebackRow>[] = [
		{ accessorKey: 'orgId', header: 'Org ID' },
		{ accessorKey: 'overallAmount', header: 'Overall amount' },
		{ accessorKey: 'principalAmount', header: 'Principal amount' },
		{
			accessorKey: 'chargebackRatio',
			header: 'Chargeback ratio',
			cell: ({ row }) => {
				const label = row.original.chargebackRatio;
				const variant = chargebackRatioChipVariant(label);
				const children = createRawSnippet(() => ({ render: () => label }));
				return renderComponent(Chip, { variant, children });
			}
		}
	];

	let pageNumber = $state(1);
</script>

<section class="flex flex-col gap-4">
	<div>
		<h1 class="text-lg font-semibold text-foreground">Chargeback</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Review chargebacks raised from payment disputes.
		</p>
	</div>

	<div class="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
		<Table
			data={rows}
			{columns}
			{pageNumber}
			totalPages={1}
			setPageNumber={(page) => (pageNumber = page)}
			variant="borderless"
		/>
	</div>
</section>
