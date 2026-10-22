<script lang="ts">
	import { Chip } from '$lib/components/ui/badge';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';

	let { isActive }: { isActive: boolean } = $props();

	const variant: BadgeVariant = $derived(isActive ? 'success' : 'disabled');
	const label = $derived(isActive ? 'Active' : 'Inactive');
</script>

<Chip {variant}>{label}</Chip>
