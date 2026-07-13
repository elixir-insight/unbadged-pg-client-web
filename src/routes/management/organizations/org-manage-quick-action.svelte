<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/reusable';
	import { Pencil } from '$lib/assets/icons';

	let { orgId }: { orgId: string } = $props();
</script>

<Button
	size="icon-sm"
	variant="ghost"
	href={resolve(`/management/organizations/${orgId}/manage` as '/')}
	class="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
	aria-label="Manage configuration"
	onclick={(event) => event.stopPropagation()}
>
	<Pencil class="size-3.5" />
</Button>
