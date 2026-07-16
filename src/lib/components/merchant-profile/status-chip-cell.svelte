<script lang="ts">
	import { Chip } from '$lib/components/reusable';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';

	let { variant, label }: { variant: BadgeVariant; label: string } = $props();
</script>

<Chip {variant}>{label}</Chip>
