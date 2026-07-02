<script lang="ts">
	import { Toaster as UIToaster } from '$lib/components/ui/sonner';
	import type { ToasterProps } from 'svelte-sonner';

	let {
		position = 'bottom-right' as ToasterProps['position'],
		expand = false,
		richColors = false,
		closeButton = false,
		duration = 4000
	}: {
		position?: ToasterProps['position'];
		expand?: boolean;
		richColors?: boolean;
		closeButton?: boolean;
		duration?: number;
	} = $props();
</script>

<UIToaster {position} {expand} {richColors} {closeButton} {duration} />
