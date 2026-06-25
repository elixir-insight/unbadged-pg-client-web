<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import DataTable from './data-table.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/DataTable',
		component: DataTable,
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: ['default', 'bordered', 'borderless'],
				description: 'Table border style'
			},
			caption: { control: 'text' },
			showingText: { control: 'text' }
		},
		args: { variant: 'default' }
	});

	const columns = [
		{ accessorKey: 'name', header: 'Name', enableSorting: true },
		{ accessorKey: 'email', header: 'Email' },
		{ accessorKey: 'role', header: 'Role', enableSorting: true },
		{ accessorKey: 'status', header: 'Status' }
	];

	const data = [
		{ id: '1', name: 'Aarav Kapoor', email: 'aarav@example.com', role: 'Admin', status: 'Active' },
		{ id: '2', name: 'Priya Sharma', email: 'priya@example.com', role: 'Editor', status: 'Active' },
		{ id: '3', name: 'Rahul Mehta', email: 'rahul@example.com', role: 'Viewer', status: 'Inactive' },
		{ id: '4', name: 'Vikram Nair', email: 'vikram@example.com', role: 'Editor', status: 'Active' },
		{ id: '5', name: 'Sneha Iyer', email: 'sneha@example.com', role: 'Viewer', status: 'Active' }
	];

	const noop = () => {};
</script>

<!-- Default variant with data -->
<Story name="Default" args={{ variant: 'default', showingText: 'Showing 5 of 5 results' }}>
	{#snippet template(args)}
		<DataTable
			{...args}
			{data}
			{columns}
			pageNumber={1}
			totalPages={1}
			setPageNumber={noop}
		/>
	{/snippet}
</Story>

<!-- Bordered -->
<Story name="Bordered" args={{ variant: 'bordered', showingText: 'Showing 5 of 5 results' }}>
	{#snippet template(args)}
		<DataTable
			{...args}
			{data}
			{columns}
			pageNumber={1}
			totalPages={1}
			setPageNumber={noop}
		/>
	{/snippet}
</Story>

<!-- Borderless -->
<Story name="Borderless" args={{ variant: 'borderless' }}>
	{#snippet template(args)}
		<DataTable
			{...args}
			{data}
			{columns}
			pageNumber={1}
			totalPages={1}
			setPageNumber={noop}
		/>
	{/snippet}
</Story>

<!-- Empty state -->
<Story name="Empty State" args={{ variant: 'default' }}>
	{#snippet template(args)}
		<DataTable
			{...args}
			data={[]}
			{columns}
			pageNumber={1}
			totalPages={1}
			setPageNumber={noop}
		/>
	{/snippet}
</Story>

<!-- With caption -->
<Story name="With Caption" args={{ caption: 'Recent Users', showingText: 'Showing 5 of 5 results' }}>
	{#snippet template(args)}
		<DataTable
			{...args}
			{data}
			{columns}
			pageNumber={1}
			totalPages={1}
			setPageNumber={noop}
		/>
	{/snippet}
</Story>

<!-- Multi-page pagination visible -->
<Story name="With Pagination" args={{ showingText: 'Showing 5 of 15 results' }}>
	{#snippet template(args)}
		<DataTable
			{...args}
			{data}
			{columns}
			pageNumber={1}
			totalPages={3}
			setPageNumber={noop}
		/>
	{/snippet}
</Story>
