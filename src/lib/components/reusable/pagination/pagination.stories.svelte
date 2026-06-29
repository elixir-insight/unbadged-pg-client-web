<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Pagination from './pagination.svelte';

	const { Story } = defineMeta({
		title: 'Reusable/Pagination',
		component: Pagination,
		tags: ['autodocs'],
		argTypes: {
			currentPage: { control: 'number', description: 'Active page number' },
			pageCount: { control: 'number', description: 'Total number of pages' }
		}
	});

	const noop = () => {};
</script>

<!-- First page — Prev disabled -->
<Story name="First Page">
	<Pagination
		currentPage={1}
		pageCount={10}
		handlePreviousClick={noop}
		handleNextClick={noop}
		handleEnterPress={noop}
	/>
</Story>

<!-- Middle page — both enabled -->
<Story name="Middle Page">
	<Pagination
		currentPage={5}
		pageCount={10}
		handlePreviousClick={noop}
		handleNextClick={noop}
		handleEnterPress={noop}
	/>
</Story>

<!-- Last page — Next disabled -->
<Story name="Last Page">
	<Pagination
		currentPage={10}
		pageCount={10}
		handlePreviousClick={noop}
		handleNextClick={noop}
		handleEnterPress={noop}
	/>
</Story>

<!-- Single page — both disabled -->
<Story name="Single Page">
	<Pagination
		currentPage={1}
		pageCount={1}
		handlePreviousClick={noop}
		handleNextClick={noop}
		handleEnterPress={noop}
	/>
</Story>
