<script lang="ts">
	import { page } from '$app/state';
	import { ErrorPage } from '$lib/components/reusable';
	import { resolve } from '$app/paths';

	const isNotFound = $derived(page.status === 404);
</script>

<ErrorPage
	code={isNotFound ? '404' : String(page.status)}
	title={isNotFound ? 'Organization not found' : 'Something went wrong'}
	description={isNotFound
		? 'The requested organization could not be found. It may have been removed or the link is incorrect.'
		: (page.error?.message ?? 'An unexpected error occurred. Please try again.')}
	actionLabel="Back to organizations"
	actionHref={resolve('/management/organizations')}
/>
