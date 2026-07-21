<script lang="ts">
	import { Input } from '$lib/components/reusable';

	let {
		effectiveFrom = $bindable(''),
		effectiveTo = $bindable('')
	}: {
		effectiveFrom?: string;
		effectiveTo?: string;
	} = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2">
	<label class="space-y-2">
		<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
			Effective from
		</span>
		<Input type="date" bind:value={effectiveFrom} />
	</label>
	<label class="space-y-2">
		<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
			Effective to
		</span>
		<Input type="date" bind:value={effectiveTo} placeholder="Open-ended" />
	</label>
</div>
