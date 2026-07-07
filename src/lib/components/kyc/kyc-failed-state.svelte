<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import { X } from '$lib/assets/icons';

	let { onRetry }: { onRetry: () => void } = $props();
</script>

<div
	class="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-8 py-10 text-center"
>
	<div class="mb-3 flex size-10 items-center justify-center rounded-full bg-destructive/10">
		<X class="size-5 text-destructive" />
	</div>
	<p class="text-sm font-medium text-destructive">Verification failed</p>
	<p class="mt-1 max-w-[280px] text-xs text-destructive/80">
		The KYC verification service could not match this record. Check the number and try again.
	</p>
	<Button variant="outline" size="sm" class="mt-4 text-xs" onclick={onRetry}>Try again</Button>
</div>
