<script lang="ts">
	import { AlertCircle } from '$lib/assets/icons';

	const decisions = [
		'GST math excluded from preview',
		'Slab gaps: hard-block vs warn?',
		'fee_config_id re-pointing on save?',
		'Auto-close prior effective_to?'
	];
</script>

<section
	class="overflow-hidden rounded-xl border border-destructive/30 bg-destructive/5 shadow-sm"
	aria-labelledby="open-decisions-title"
>
	<div class="border-b border-destructive/20 px-5 py-4">
		<div class="flex items-center gap-2">
			<AlertCircle class="size-4 text-destructive" aria-hidden="true" />
			<h2 id="open-decisions-title" class="text-sm font-semibold text-foreground">
				Open decisions
			</h2>
		</div>
		<p class="mt-1 text-xs text-muted-foreground">
			Confirm with product before finalizing save handlers.
		</p>
	</div>
	<ul class="space-y-2 p-5 text-sm text-muted-foreground">
		{#each decisions as decision (decision)}
			<li class="flex items-start gap-2">
				<span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" aria-hidden="true"
				></span>
				<span>{decision}</span>
			</li>
		{/each}
	</ul>
</section>
