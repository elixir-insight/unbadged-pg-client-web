<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<div class="m-auto w-full space-y-6 md:w-[75%]" aria-busy="true" aria-label="Loading role details">
	<!-- Header -->
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="space-y-2">
			<div class="flex flex-wrap items-center gap-2">
				<Skeleton class="h-8 w-48" />
				<Skeleton class="h-5 w-16 rounded-full" />
			</div>
			<Skeleton class="h-4 w-28" />
		</div>
		<div class="flex items-center gap-2">
			<Skeleton class="h-9 w-24 rounded-md" />
			<Skeleton class="h-9 w-20 rounded-md" />
		</div>
	</div>

	<!-- Description -->
	<div class="rounded-xl border border-border bg-card p-5 shadow">
		<Skeleton class="mb-4 h-4 w-32" />
		<div class="min-h-24 rounded-lg border border-border bg-background/50 p-4">
			<div class="space-y-2">
				<Skeleton class="h-3.5 w-full" />
				<Skeleton class="h-3.5 w-5/6" />
				<Skeleton class="h-3.5 w-2/3" />
			</div>
		</div>
	</div>

	<!-- Access & permissions -->
	<div class="rounded-xl border border-border bg-card p-5 shadow">
		<Skeleton class="mb-4 h-4 w-40" />
		<div class="space-y-3">
			<div class="flex items-center gap-4">
				<Skeleton class="h-4 w-36" />
				{#each [0, 1, 2, 3, 4] as i (i)}
					<Skeleton class="mx-auto h-4 w-4 rounded-full" />
				{/each}
			</div>
			{#each [0, 1, 2, 3, 4, 5] as row (row)}
				<div class="flex items-center gap-4 border-t border-border pt-3">
					<div class="flex w-36 items-center gap-3">
						<Skeleton class="h-8 w-8 rounded-lg" />
						<Skeleton class="h-3.5 w-24" />
					</div>
					{#each [0, 1, 2, 3, 4] as i (i)}
						<Skeleton class="mx-auto h-4 w-4 rounded-full" />
					{/each}
				</div>
			{/each}
		</div>
	</div>

	<!-- Assigned users -->
	<div class="rounded-xl border border-border bg-card p-5 shadow">
		<div class="mb-4 space-y-1">
			<Skeleton class="h-4 w-32" />
			<Skeleton class="h-3 w-16" />
		</div>
		<div class="divide-y divide-border">
			{#each [0, 1, 2, 3] as i (i)}
				<div class="flex items-center justify-between py-3">
					<div class="flex items-center gap-3">
						<Skeleton class="h-10 w-10 rounded-full" />
						<Skeleton class="h-4 w-32" />
					</div>
					<Skeleton class="h-4 w-44" />
				</div>
			{/each}
		</div>
	</div>
</div>
