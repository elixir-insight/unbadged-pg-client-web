<script lang="ts">
	import { AlertCircle } from '$lib/assets/icons';

	let { items }: { items: string[] } = $props();
</script>

{#if items.length > 0}
	<div
		class="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900/50 dark:bg-amber-950/20"
	>
		<div class="flex items-start gap-3">
			<AlertCircle class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
			<div>
				<p class="text-sm font-medium text-amber-900 dark:text-amber-200">
					Items needing attention
				</p>
				<p class="mt-0.5 text-[13px] text-amber-700 dark:text-amber-400">
					{items.join(' · ')}
				</p>
			</div>
		</div>
	</div>
{/if}
