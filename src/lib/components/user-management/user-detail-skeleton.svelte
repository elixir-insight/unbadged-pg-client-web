<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<div
	class="m-auto flex w-full flex-col gap-6 md:w-[75%]"
	aria-busy="true"
	aria-label="Loading user details"
>
	<section class="overflow-hidden rounded-xl border border-border bg-card">
		<Skeleton class="h-28 rounded-none sm:h-32" />

		<div class="relative px-4 pb-6 sm:px-6">
			<div class="absolute -top-10 left-4 sm:-top-12 sm:left-6">
				<Skeleton class="size-20 rounded-full sm:size-24" />
			</div>

			<div class="space-y-3 pt-12 sm:pt-14">
				<Skeleton class="h-7 w-48" />
				<Skeleton class="h-4 w-32" />
				<div class="flex flex-col gap-3 sm:flex-row sm:gap-6">
					<Skeleton class="h-4 w-44" />
					<Skeleton class="h-4 w-36" />
				</div>
			</div>
		</div>
	</section>

	<section class="overflow-hidden rounded-xl border border-border bg-card">
		{#each [0, 1, 2, 3] as i (i)}
			<div
				class={[
					'flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5',
					i < 3 && 'border-b border-border/40'
				]}
			>
				<Skeleton class="h-4 w-28" />
				<Skeleton class="h-4 w-40" />
			</div>
		{/each}
	</section>

	<section class="overflow-hidden rounded-xl border border-border bg-card">
		<div class="flex items-center gap-2 border-b border-border/40 px-4 py-3 sm:px-5">
			<Skeleton class="h-8 w-8 rounded-lg" />
			<Skeleton class="h-4 w-28" />
			<Skeleton class="h-5 w-6 rounded-full" />
		</div>
		<div class="flex flex-wrap gap-2 px-4 py-4 sm:px-5">
			{#each [0, 1, 2] as i (i)}
				<Skeleton class="h-7 w-28 rounded-full" />
			{/each}
		</div>
	</section>

	<div class="flex justify-end gap-2 pb-2">
		<Skeleton class="h-9 w-24 rounded-md" />
		<Skeleton class="h-9 w-20 rounded-md" />
	</div>
</div>
