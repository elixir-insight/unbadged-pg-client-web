<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderComponent } from '$lib/components/ui/data-table';
	import { Table } from '$lib/components/reusable';
	import { WalletCard } from '$lib/assets/icons';
	import { statusVariant, statusLabel, type VirtualAccount } from './mock-data';
	import InfoCard from './info-card.svelte';
	import AccountNumberCell from './account-number-cell.svelte';
	import StatusChipCell from './status-chip-cell.svelte';

	let { accounts }: { accounts: VirtualAccount[] } = $props();

	let pageNumber = $state(1);

	const columns: ColumnDef<VirtualAccount>[] = [
		{
			accessorKey: 'accountNumber',
			header: 'Virtual Account Number',
			cell: (info) => renderComponent(AccountNumberCell, { value: info.getValue<string>() })
		},
		{ accessorKey: 'accountType', header: 'Account Type' },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) => {
				const status = info.getValue<VirtualAccount['status']>();
				return renderComponent(StatusChipCell, {
					variant: statusVariant(status),
					label: statusLabel(status)
				});
			}
		},
		{ accessorKey: 'createdDate', header: 'Created Date' }
	];
</script>

<InfoCard title="Virtual Accounts" icon={WalletCard} contentClass="p-0">
	<Table
		data={accounts}
		{columns}
		{pageNumber}
		totalPages={1}
		setPageNumber={(p) => (pageNumber = p)}
		variant="borderless"
	/>
</InfoCard>
