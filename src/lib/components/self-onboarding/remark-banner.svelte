<script lang="ts">
	import { Chip } from '$lib/components/reusable';
	import { ChevronRight, TriangleAlert } from '$lib/assets/icons';
	import { remarkDocument, type RoutedRemark } from '$lib/utils/remarkRouting';
	import { STEPS } from './steps';

	let {
		remarks,
		onFix
	}: {
		remarks: RoutedRemark[];
		onFix: (remark: RoutedRemark) => void;
	} = $props();

	const count = $derived(remarks.length);

	/** Remarks grouped by onboarding step, in step order. */
	const groups = $derived.by(() => {
		const byStep: Record<number, RoutedRemark[]> = {};
		for (const remark of remarks) {
			(byStep[remark.step] ??= []).push(remark);
		}
		return Object.entries(byStep)
			.map(([step, items]) => ({ step: Number(step), items }))
			.sort((a, b) => a.step - b.step);
	});

	function isDocument(remark: RoutedRemark): boolean {
		return remarkDocument(remark.key) !== null;
	}
</script>

{#if count > 0}
	<section
		class="overflow-hidden rounded-xl border border-warning/40 bg-card"
		role="status"
		aria-live="polite"
		aria-label="Action required"
	>
		<header class="flex items-center gap-3 border-b border-warning/30 bg-warning/10 px-4 py-3">
			<span
				class="flex size-7 shrink-0 items-center justify-center rounded-full bg-warning/20 text-warning"
			>
				<TriangleAlert class="size-4" aria-hidden="true" />
			</span>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-semibold text-foreground">Action required</p>
				<p class="text-xs text-muted-foreground">Requested by our team</p>
			</div>
			<Chip variant="warning">{count} left</Chip>
		</header>

		<div class="flex flex-col">
			{#each groups as group (group.step)}
				<div class="border-b border-border/60 px-4 py-3 last:border-b-0">
					<div class="mb-2 flex items-center justify-between">
						<h3 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							{STEPS[group.step - 1]?.title ?? 'Other'}
						</h3>
						<span class="text-xs text-muted-foreground">{group.items.length}</span>
					</div>
					<ul class="flex flex-col gap-1">
						{#each group.items as remark (remark.key)}
							{@const document = isDocument(remark)}
							<li>
								<button
									type="button"
									class="flex w-full items-start gap-2 rounded-md px-1 py-1.5 text-left hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
									onclick={() => onFix(remark)}
								>
									<span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true"
									></span>
									<span class="min-w-0 flex-1">
										<span class="block text-sm text-foreground">{remark.field}</span>
										{#if !document && remark.message}
											<span class="block text-xs text-muted-foreground">“{remark.message}”</span>
										{/if}
									</span>
									<span class="flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary">
										{document ? 'Re-upload' : 'Fix'}
										<ChevronRight class="size-3.5" aria-hidden="true" />
									</span>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<p class="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
			Each item opens the step where you can fix it.
		</p>
	</section>
{/if}
