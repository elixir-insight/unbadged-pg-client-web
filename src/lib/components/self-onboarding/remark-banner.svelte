<script lang="ts">
	import { Button } from '$lib/components/reusable';
	import { AlertCircle } from '$lib/assets/icons';
	import type { RoutedRemark } from '$lib/utils/remarkRouting';
	import { STEPS } from './steps';

	let {
		remarks,
		onFix
	}: {
		remarks: RoutedRemark[];
		onFix: (remark: RoutedRemark) => void;
	} = $props();

	const count = $derived(remarks.length);
</script>

{#if count > 0}
	<div
		class="mb-4 rounded-lg border border-warning/40 bg-warning/8 px-4 py-3"
		role="status"
		aria-live="polite"
	>
		<div class="flex items-start gap-2">
			<AlertCircle class="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
			<div class="min-w-0 flex-1">
				<p class="text-sm font-semibold text-warning-foreground">
					Action Required — {count}
					{count === 1 ? 'change' : 'changes'}
				</p>
				<ul class="mt-2 flex flex-col gap-2">
					{#each remarks as remark (remark.key)}
						<li class="flex flex-wrap items-center justify-between gap-2">
							<p class="text-sm text-foreground">
								<span class="font-medium">{STEPS[remark.step - 1].title}:</span>
								{remark.field} — {remark.message}
							</p>
							<Button variant="outline" size="sm" onclick={() => onFix(remark)}>Fix this →</Button>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
{/if}
