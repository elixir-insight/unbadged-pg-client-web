<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft } from '$lib/assets/icons';

	interface Props {
		onBack: () => void;
		summary: Snippet;
		details: Snippet;
		timeline: Snippet;
		sidebarActions?: Snippet;
	}

	let { onBack, summary, details, timeline, sidebarActions }: Props = $props();
</script>

<div class="flex flex-col gap-4">
	<Button
		variant="ghost"
		size="sm"
		class="-ml-2 w-fit gap-1 text-muted-foreground"
		onclick={onBack}
	>
		<ChevronLeft class="size-4" />
		Go back
	</Button>

	<div
		class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]"
	>
		<div class="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
			<div class="p-5 sm:p-6">
				{@render summary()}
			</div>

			<div class="border-t border-border"></div>

			<div class="p-5 sm:p-6">
				{@render details()}
			</div>
		</div>

		<aside class="lg:sticky lg:top-4">
			<div class="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
				<div class="p-5 sm:p-6">
					<h2 class="mb-4 text-sm font-semibold text-foreground">Timeline</h2>
					{@render timeline()}
				</div>

				{#if sidebarActions}
					<div class="border-t border-border"></div>
					<div class="p-5 sm:p-6">
						{@render sidebarActions()}
					</div>
				{/if}
			</div>
		</aside>
	</div>
</div>
