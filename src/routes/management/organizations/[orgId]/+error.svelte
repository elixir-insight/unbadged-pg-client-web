<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/reusable';
	import { ArrowRight, Building2 } from '$lib/assets/icons';

	const isNotFound = $derived(page.status === 404);
</script>

<div class="rounded-xl border border-dashed border-border/60 bg-card p-8 text-center">
	<Building2 class="mx-auto mb-3 size-8 text-muted-foreground" />
	<h1 class="text-lg font-semibold">
		{isNotFound ? 'Organization not found' : 'Something went wrong'}
	</h1>
	<p class="mt-2 text-sm text-muted-foreground">
		{isNotFound
			? 'The requested organization could not be located in the mock dataset.'
			: (page.error?.message ?? 'An unexpected error occurred.')}
	</p>
	<Button class="mt-4" href={resolve('/management/organizations')}>
		<ArrowRight class="size-4" />
		Back to organizations
	</Button>
</div>
