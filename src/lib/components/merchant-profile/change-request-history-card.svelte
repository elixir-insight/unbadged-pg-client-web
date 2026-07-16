<script lang="ts">
	import type { ColumnDef } from '@tanstack/table-core';
	import { renderComponent } from '$lib/components/ui/data-table';
	import { Table } from '$lib/components/reusable';
	import { FileClock } from '$lib/assets/icons';
	import { changeRequestVariant, changeRequestLabel, type ChangeRequest } from './mock-data';
	import InfoCard from './info-card.svelte';
	import StatusChipCell from './status-chip-cell.svelte';

	let { requests }: { requests: ChangeRequest[] } = $props();

	const pageSize = 5;
	let pageNumber = $state(1);

	const totalPages = $derived(Math.max(1, Math.ceil(requests.length / pageSize)));
	const pagedRequests = $derived(
		requests.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
	);

	const columns: ColumnDef<ChangeRequest>[] = [
		{ accessorKey: 'requestId', header: 'Request ID' },
		{ accessorKey: 'category', header: 'Category' },
		{ accessorKey: 'requestedBy', header: 'Requested By' },
		{ accessorKey: 'requestedOn', header: 'Requested On' },
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) => {
				const status = info.getValue<ChangeRequest['status']>();
				return renderComponent(StatusChipCell, {
					variant: changeRequestVariant(status),
					label: changeRequestLabel(status)
				});
			}
		},
		{ accessorKey: 'reviewedBy', header: 'Reviewed By' }
	];
</script>

<InfoCard
	title="Change Request History"
	description="Recent profile change requests and their review status"
	icon={FileClock}
	contentClass="p-0"
>
	<Table
		data={pagedRequests}
		{columns}
		{pageNumber}
		{totalPages}
		setPageNumber={(p) => (pageNumber = p)}
		variant="borderless"
	/>
</InfoCard>
