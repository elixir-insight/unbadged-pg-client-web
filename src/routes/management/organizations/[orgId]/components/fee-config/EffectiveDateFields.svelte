<script lang="ts">
	import { Input } from '$lib/components/reusable';

	let {
		effectiveFrom = $bindable(''),
		effectiveTo = $bindable(''),
		disabled = false
	}: {
		effectiveFrom?: string;
		effectiveTo?: string;
		disabled?: boolean;
	} = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2">
	<label class="space-y-2">
		<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
			Effective from
		</span>
		<Input type="date" bind:value={effectiveFrom} {disabled} />
	</label>
	<label class="space-y-2">
		<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
			Effective to
		</span>
		<Input type="date" bind:value={effectiveTo} placeholder="Open-ended" {disabled} />
	</label>
</div>
