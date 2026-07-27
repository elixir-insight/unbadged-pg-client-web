<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<div class="m-auto w-full space-y-6 md:w-[75%]" aria-busy="true" aria-label="Loading user form">
	<!-- Header -->
	<div class="space-y-2">
		<Skeleton class="h-8 w-36" />
		<Skeleton class="h-4 w-64" />
	</div>

	<!-- User detail card -->
	<div class="rounded-xl border border-border bg-card p-5 shadow">
		<Skeleton class="mb-5 h-4 w-24" />
		<div class="space-y-4">
			<div class="space-y-1.5">
				<Skeleton class="h-4 w-20" />
				<Skeleton class="h-9 w-full rounded-md" />
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each [0, 1, 2, 3] as i (i)}
					<div class="space-y-1.5">
						<Skeleton class="h-4 w-24" />
						<Skeleton class="h-9 w-full rounded-md" />
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Roles & reporting panel -->
	<div class="overflow-hidden rounded-xl border border-border bg-card shadow">
		<div class="border-b border-border px-5 py-4">
			<Skeleton class="h-4 w-40" />
		</div>
		<div class="flex h-96">
			<div class="w-56 shrink-0 space-y-2 border-r border-border p-3">
				{#each [0, 1] as i (i)}
					<Skeleton class="h-10 w-full rounded-lg" />
				{/each}
			</div>
			<div class="flex-1 space-y-3 overflow-hidden p-5">
				{#each [0, 1, 2, 3, 4] as i (i)}
					<div class="flex items-center justify-between rounded-lg border border-border px-4 py-3">
						<div class="flex items-center gap-3">
							<Skeleton class="h-4 w-4 rounded" />
							<Skeleton class="h-4 w-36" />
						</div>
						<Skeleton class="h-4 w-4 rounded" />
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div class="flex justify-end gap-2">
		<Skeleton class="h-9 w-20 rounded-md" />
		<Skeleton class="h-9 w-24 rounded-md" />
	</div>
</div>
