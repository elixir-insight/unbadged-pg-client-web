<script lang="ts">
	import { ChevronRight } from '$lib/assets/icons';

	let { orderId, onOpen }: { orderId: string; onOpen: () => void } = $props();
</script>

<button
	type="button"
	onclick={(event) => {
		event.stopPropagation();
		onOpen();
	}}
	aria-label="View fee breakdown for {orderId}"
	class="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
>
	<ChevronRight class="size-4" />
</button>
