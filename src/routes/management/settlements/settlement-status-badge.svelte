<script lang="ts">
	import { Chip } from '$lib/components/ui/badge';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';
	import type { SettlementStatus } from './types';

	let { status }: { status: SettlementStatus } = $props();

	const variant: BadgeVariant = $derived(status === 'completed' ? 'success' : 'warning');
	const label = $derived(status === 'completed' ? 'Completed' : 'Pending');
</script>

<Chip {variant}>{label}</Chip>
