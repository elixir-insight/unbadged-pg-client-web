<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';

	let { count = 6 }: { count?: number } = $props();
</script>

{#each Array.from({ length: count }, (_, i) => i) as i (i)}
	<div
		class="flex min-h-40 w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow"
		aria-hidden="true"
	>
		<div class="flex flex-col gap-3 p-4">
			<div class="flex items-start justify-between">
				<div class="flex items-center gap-4">
					<Skeleton class="h-10 w-10 shrink-0 rounded-lg" />
					<Skeleton class="h-4 w-28" />
				</div>
				<Skeleton class="h-5 w-14 rounded-full" />
			</div>
			<div class="space-y-1.5">
				<Skeleton class="h-3 w-full" />
				<Skeleton class="h-3 w-3/4" />
			</div>
		</div>
		<div class="border-t border-border"></div>
		<div class="flex items-center px-4 py-3">
			<Skeleton class="h-3 w-24" />
		</div>
	</div>
{/each}
