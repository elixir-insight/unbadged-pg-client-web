<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SearchField from './search-field.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/SearchField',
		component: SearchField,
		tags: ['autodocs'],
		argTypes: {
			fields: { control: 'object', description: 'Array of searchable field options' },
			field: { control: 'text', description: 'Currently selected field value' },
			value: { control: 'text', description: 'Current search query' }
		}
	});

	const transactionFields = [
		{ value: 'txnId', label: 'Transaction ID', placeholder: 'e.g. TXN-1001…' },
		{ value: 'customer', label: 'Customer', placeholder: 'e.g. Arjun Mehta…' },
		{ value: 'method', label: 'Payment Method', placeholder: 'e.g. UPI…' },
		{ value: 'amount', label: 'Amount', placeholder: 'e.g. 4500…' }
	];

	const singleField = [{ value: 'email', label: 'Email', placeholder: 'Search by email…' }];

	const manyFields = [
		{ value: 'id', label: 'ID' },
		{ value: 'name', label: 'Name' },
		{ value: 'email', label: 'Email' },
		{ value: 'phone', label: 'Phone' },
		{ value: 'city', label: 'City' },
		{ value: 'status', label: 'Status' }
	];
</script>

<!-- Default — first field selected, empty query -->
<Story name="Default" args={{ fields: transactionFields, field: 'txnId', value: '' }}>
	{#snippet template(args)}
		<div class="w-72">
			<SearchField {...args} />
		</div>
	{/snippet}
</Story>

<!-- With a pre-filled value (shows the clear X button) -->
<Story name="With Value" args={{ fields: transactionFields, field: 'customer', value: 'Arjun' }}>
	{#snippet template(args)}
		<div class="w-72">
			<SearchField {...args} />
		</div>
	{/snippet}
</Story>

<!-- Single field — no choice to switch, dropdown has one item -->
<Story name="Single Field" args={{ fields: singleField, field: 'email', value: '' }}>
	{#snippet template(args)}
		<div class="w-72">
			<SearchField {...args} />
		</div>
	{/snippet}
</Story>

<!-- Many fields in the dropdown -->
<Story name="Many Fields" args={{ fields: manyFields, field: 'id', value: '' }}>
	{#snippet template(args)}
		<div class="w-72">
			<SearchField {...args} />
		</div>
	{/snippet}
</Story>

<!-- Full width -->
<Story name="Full Width" args={{ fields: transactionFields, field: 'txnId', value: '' }}>
	{#snippet template(args)}
		<div class="w-full max-w-xl">
			<SearchField {...args} />
		</div>
	{/snippet}
</Story>

<!-- Narrow -->
<Story name="Narrow" args={{ fields: transactionFields, field: 'txnId', value: '' }}>
	{#snippet template(args)}
		<div class="w-56">
			<SearchField {...args} />
		</div>
	{/snippet}
</Story>

<!-- Live search — interactive, use Controls panel to watch field/value update -->
<Story name="Live Search" args={{ fields: transactionFields, field: 'txnId', value: '' }}>
	{#snippet template(args)}
		<div class="w-80">
			<SearchField {...args} />
		</div>
	{/snippet}
</Story>
